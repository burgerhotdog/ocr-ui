import { Stack, Paper, Typography, Button } from "@mui/material";
import { ImageSearch, UploadFile } from "@mui/icons-material";

const ImageSource = ({
  initialCrop,
  setImageSrc,
  setCrop,
  setCompletedCrop,
}) => {
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

  return (
    <Stack component={Paper} p={2} spacing={2} height="100%">
      <Typography
        variant="h6"
        color="primary"
        gutterBottom
        fontWeight="bold"
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          mb: { xs: 1.5, md: 2 },
        }}
      >
        <UploadFile color="primary" />
        Upload Image
      </Typography>
      <Button
        component="label"
        variant="contained"
        size="large"
        startIcon={<ImageSearch />}
        fullWidth
        sx={{ textTransform: "none" }}
      >
        Select Image
        <input
          type="file"
          hidden
          accept="image/*"
          onChange={handleFileChange}
        />
      </Button>
    </Stack>
  );
};

export default ImageSource;
