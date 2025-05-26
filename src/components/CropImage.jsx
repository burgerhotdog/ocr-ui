import { useCallback } from "react";
import { Paper, Typography, Button, Box, CircularProgress } from "@mui/material";
import { ImageSearch } from "@mui/icons-material";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

const CropImage = ({
  imageRef,
  imageSrc,
  crop,
  setCrop,
  completedCrop,
  setCompletedCrop,
  onImageLoad,
  processOCR,
  ocrLoading,
}) => {

  // Get cropped image
  const getCroppedImg = useCallback(
    (cropData = completedCrop) => {
      if (!cropData || !imageRef) {
        console.log("Missing cropData or imageRef");
        return null;
      }

      // Check if crop has width and height
      if (!cropData.width || !cropData.height) {
        console.log("No valid crop dimensions", cropData);
        return null;
      }

      const canvas = document.createElement("canvas");
      const scaleX = imageRef.naturalWidth / imageRef.width;
      const scaleY = imageRef.naturalHeight / imageRef.height;

      // Handle both percentage and pixel units
      let cropX, cropY, cropWidth, cropHeight;

      if (cropData.unit === "%") {
        cropX = (cropData.x / 100) * imageRef.width * scaleX;
        cropY = (cropData.y / 100) * imageRef.height * scaleY;
        cropWidth = (cropData.width / 100) * imageRef.width * scaleX;
        cropHeight = (cropData.height / 100) * imageRef.height * scaleY;
      } else {
        cropX = cropData.x * scaleX;
        cropY = cropData.y * scaleY;
        cropWidth = cropData.width * scaleX;
        cropHeight = cropData.height * scaleY;
      }

      console.log("Crop values:", {
        x: cropX,
        y: cropY,
        width: cropWidth,
        height: cropHeight,
        original: cropData,
      });

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        imageRef,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            console.error("Canvas toBlob returned null");
            resolve(null);
            return;
          }
          resolve(blob);
        }, "image/jpeg");
      });
    },
    [completedCrop, imageRef]
  );

  return (
    <Paper
      elevation={2}
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderRadius: { xs: 1.5, md: 2 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        color="primary"
        fontWeight="bold"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: { xs: 1.5, md: 2 },
        }}
      >
        <ImageSearch color="primary" />
        Crop Image
      </Typography>
      <Box sx={{
        borderRadius: 1.5,
        p: 1,
        mb: 2,
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
      }}>
        <ReactCrop
          crop={crop}
          onChange={(_, percentCrop) => setCrop(percentCrop)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={undefined}
        >
          <img
            src={imageSrc}
            onLoad={onImageLoad}
            alt="Crop preview"
            crossOrigin="anonymous"
            style={{
              maxWidth: "100%",
              maxHeight: "300px",
              margin: "0 auto",
              display: "block",
            }}
          />
        </ReactCrop>
      </Box>
      <Button
        variant="contained"
        onClick={processOCR}
        disabled={ocrLoading}
        fullWidth
        sx={{
          textTransform: "none",
        }}
      >
        {ocrLoading ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Extract Text"
        )}
      </Button>
    </Paper>
  );
};

export default CropImage;
