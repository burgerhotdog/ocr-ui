import React, { useState, useCallback, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Alert,
  Grid,
  Divider,
  useTheme,
  alpha,
} from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import LinkIcon from "@mui/icons-material/Link";
import ImageSearchIcon from "@mui/icons-material/ImageSearch";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

function App() {
  const theme = useTheme();
  const [imageSrc, setImageSrc] = useState(null);
  const initialCrop = { unit: "%", width: 50, height: 50, x: 25, y: 25 };
  const [crop, setCrop] = useState(initialCrop);
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);
  const [url, setUrl] = useState("");
  const [textResult, setTextResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [urlLoading, setUrlLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Handle file upload
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result);
        // Reset crop when loading a new image
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // Handle URL submission
  const handleUrlSubmit = () => {
    if (url) {
      setUrlLoading(true);
      setError("");

      // Create a new image to test loading
      const testImg = new Image();
      testImg.crossOrigin = "anonymous";

      // Set up handlers for success and error
      testImg.onload = () => {
        setImageSrc(url);
        setUrl("");
        // Reset crop when loading a new image
        setCrop(initialCrop);
        setCompletedCrop(initialCrop);
        setUrlLoading(false);
      };

      testImg.onerror = () => {
        setError(
          "Could not load image from URL. This may be due to CORS restrictions. Try uploading the file directly instead."
        );
        setUrlLoading(false);
      };

      // Start loading the image
      testImg.src = url;
    }
  };

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
    <Box
      sx={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.light,
          0.1
        )}, ${alpha(theme.palette.background.default, 0.9)})`,
        py: { xs: 3, md: 6 },
      }}
    >
      <Container maxWidth="xl" sx={{ maxWidth: "1400px" }}>
        <Paper
          elevation={4}
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            mb: 4,
            borderRadius: { xs: 1.5, md: 2 },
            maxWidth: "100%",
            mx: "auto",
            background: `linear-gradient(145deg, ${
              theme.palette.background.paper
            }, ${alpha(theme.palette.background.paper, 0.9)})`,
            boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <Typography
            variant="h4"
            gutterBottom
            align="center"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: { xs: 2, md: 4 },
              fontSize: { xs: "1.75rem", md: "2.25rem" },
            }}
          >
            Image to Text Converter
          </Typography>
          <Divider sx={{ mb: { xs: 2, md: 3 } }} />

          <Grid
            container
            spacing={{ xs: 2, md: 3 }}
            justifyContent={!imageSrc ? "center" : "flex-start"}
          >
            {/* Image Upload */}
            <Grid size={{ xs: 12, md: imageSrc ? 6 : 8 }}>
              <Paper
                elevation={2}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderRadius: { xs: 1.5, md: 2 },
                  height: "100%",
                  background: alpha(theme.palette.background.paper, 0.8),
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    mb: { xs: 1.5, md: 2 },
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                  }}
                >
                  <UploadFileIcon color="primary" />
                  Upload Image
                </Typography>
                <Button
                  variant="contained"
                  component="label"
                  fullWidth
                  sx={{
                    mb: 2,
                    py: { xs: 1, md: 1.5 },
                    borderRadius: 1.5,
                    textTransform: "none",
                    fontSize: { xs: "0.9rem", md: "1rem" },
                  }}
                  startIcon={<ImageSearchIcon />}
                >
                  Select Image
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </Button>

                <Divider sx={{ my: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    OR
                  </Typography>
                </Divider>

                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    my: { xs: 1.5, md: 2 },
                    color: theme.palette.text.primary,
                    fontWeight: 600,
                    fontSize: { xs: "1.1rem", md: "1.25rem" },
                  }}
                >
                  <LinkIcon color="primary" />
                  Paste Image URL
                </Typography>
                <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                  <TextField
                    fullWidth
                    label="Image URL"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    size="small"
                    variant="outlined"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 1.5,
                      },
                    }}
                  />
                  <Button
                    variant="contained"
                    onClick={handleUrlSubmit}
                    disabled={!url || urlLoading}
                    sx={{
                      borderRadius: 1.5,
                      px: { xs: 2, md: 3 },
                      textTransform: "none",
                    }}
                  >
                    {urlLoading ? <CircularProgress size={24} /> : "Load"}
                  </Button>
                </Box>
              </Paper>
            </Grid>

            {/* Crop and Result - Only shown when image is loaded */}
            {imageSrc && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: { xs: 1.5, md: 2 },
                    background: alpha(theme.palette.background.paper, 0.8),
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      color: theme.palette.text.primary,
                      fontWeight: 600,
                      mb: { xs: 1.5, md: 2 },
                      fontSize: { xs: "1.1rem", md: "1.25rem" },
                    }}
                  >
                    <ImageSearchIcon color="primary" />
                    Crop Image
                  </Typography>
                  <Box
                    sx={{
                      border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                      borderRadius: 1.5,
                      p: 1,
                      mb: 2,
                      flex: 1,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      overflow: "hidden",
                    }}
                  >
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
                      py: { xs: 1, md: 1.5 },
                      borderRadius: 1.5,
                      textTransform: "none",
                      fontSize: { xs: "0.9rem", md: "1rem" },
                    }}
                  >
                    {ocrLoading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Extract Text"
                    )}
                  </Button>
                </Paper>
              </Grid>
            )}

            {/* Results */}
            <Grid size={12} sx={{ mt: { xs: 1, md: 2 } }}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2,
                    borderRadius: 1.5,
                  }}
                >
                  {error}
                </Alert>
              )}
              {textResult && (
                <Paper
                  elevation={2}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    borderRadius: { xs: 1.5, md: 2 },
                    maxWidth: "1000px",
                    mx: "auto",
                    background: alpha(theme.palette.background.paper, 0.8),
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: { xs: 1.5, md: 2 },
                      flexDirection: { xs: "column", sm: "row" },
                      gap: { xs: 1, sm: 0 },
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        fontSize: { xs: "1.1rem", md: "1.25rem" },
                      }}
                    >
                      <ContentCopyIcon color="primary" />
                      Extracted Text
                    </Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ContentCopyIcon />}
                      onClick={copyToClipboard}
                      sx={{
                        borderRadius: 1.5,
                        textTransform: "none",
                        px: { xs: 2, md: 2.5 },
                      }}
                    >
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </Box>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={textResult}
                    InputProps={{
                      readOnly: true,
                      sx: {
                        borderRadius: 1.5,
                        fontFamily: "monospace",
                        fontSize: { xs: "0.85rem", md: "0.9rem" },
                      },
                    }}
                  />
                </Paper>
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
