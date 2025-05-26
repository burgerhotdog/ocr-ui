import { useState, useCallback, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Paper,
  Alert,
  Grid,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import { ImageSource, CropImage, ExtractedText } from "./components";

function App() {
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState(null);
  const initialCrop = { unit: "%", width: 50, height: 50, x: 25, y: 25 };
  const [crop, setCrop] = useState(initialCrop);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [textResult, setTextResult] = useState("");
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Handle image load
  const onImageLoad = (e) => {
    setImageRef(e.currentTarget);
    // Set initial completed crop when image loads
    setCompletedCrop(initialCrop);
  };

  // Ensure we have a valid completedCrop before processing
  useEffect(() => {
    if (imageSrc && (!completedCrop || !completedCrop.width)) {
      setCompletedCrop(initialCrop);
    }
  }, [imageSrc, completedCrop]);

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

  // Handle OCR processing
  const processOCR = async () => {
    setOcrLoading(true);
    setError("");
    setTextResult("");

    try {
      const formData = new FormData();

      if (!imageSrc) {
        setError("No image loaded");
        setOcrLoading(false);
        return;
      }

      // Make sure we have a valid crop
      let cropToUse = completedCrop;
      if (!cropToUse || !cropToUse.width || !cropToUse.height) {
        cropToUse = initialCrop;
      }

      console.log("Using crop:", cropToUse);

      const croppedBlob = await getCroppedImg(cropToUse);

      if (croppedBlob) {
        console.log("Using cropped image");
        formData.append("file", croppedBlob, "cropped.jpg");
      } else {
        // If cropping failed, use the full image
        console.log("Cropping failed, using full image");
        const response = await fetch(imageSrc);
        const blob = await response.blob();
        formData.append("file", blob, "image.jpg");
      }

      const apiResponse = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: "helloworld", // Free API key from OCR.Space
        },
        body: formData,
      });
      console.log("apiResponse", apiResponse);

      const result = await apiResponse.json();

      if (result.ParsedResults && result.ParsedResults.length > 0) {
        setTextResult(result.ParsedResults[0].ParsedText);
      } else {
        setError("No text found in the image");
      }
    } catch (err) {
      setError("Error processing image: " + err.message);
    } finally {
      setOcrLoading(false);
    }
  };

  // Copy text to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(textResult).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      background: `linear-gradient(135deg, ${alpha(
        theme.palette.primary.light,
        0.1
      )}, ${alpha(theme.palette.background.default, 0.9)})`,
      py: { xs: 3, md: 6 },
    }}>
      <Container maxWidth="xl">
        <Paper sx={{
          p: 4,
          mb: 4,
          maxWidth: "100%",
          mx: "auto",
        }}>
          <Typography
            variant="h4"
            align="center"
            color="primary"
            gutterBottom
            sx={{
              fontWeight: 700,
              mb: { xs: 2, md: 4 },
              fontSize: { xs: "1.75rem", md: "2.25rem" },
            }}
          >
            Image to Text Converter
          </Typography>
          <Divider sx={{ mb: { xs: 2, md: 3 } }} />

          <Grid
            container
            spacing={3}
            justifyContent={!imageSrc ? "center" : "flex-start"}
          >
            {/* Image Upload */}
            <Grid size={{ xs: 12, md: 6 }}>
              <ImageSource
                initialCrop={initialCrop}
                setImageSrc={setImageSrc}
                setCrop={setCrop}
                setCompletedCrop={setCompletedCrop}
              />
            </Grid>

            {/* Crop and Result - Only shown when image is loaded */}
            {imageSrc && (
              <Grid size={{ xs: 12, md: 6 }}>
                <CropImage 
                  imageSrc={imageSrc}
                  crop={crop}
                  setCrop={setCrop}
                  completedCrop={completedCrop}
                  setCompletedCrop={setCompletedCrop}
                  onImageLoad={onImageLoad}
                  processOCR={processOCR}
                  ocrLoading={ocrLoading}
                />
              </Grid>
            )}

            {/* Results */}
            <Grid size={12} sx={{ mt: { xs: 1, md: 2 } }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{ mb: 2, borderRadius: 1.5}}
                >
                  {error}
                </Alert>
              )}
              {textResult && (
                <ExtractedText
                  textResult={textResult}
                  copyToClipboard={copyToClipboard}
                  copied={copied}
                />
              )}
            </Grid>
          </Grid>
        </Paper>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          sx={{ mt: 2, mb: 2 }}
        >
          Built with React and Material-UI • Using OCR.Space API
        </Typography>
      </Container>
    </Box>
  );
}

export default App;
