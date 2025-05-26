import { Paper, Typography, Button, Box, TextField } from "@mui/material";
import { ContentCopy } from "@mui/icons-material";

const ExtractedText = ({ textResult, copyToClipboard, copied }) => {
  return (
    <Paper sx={{
      p: { xs: 1.5, sm: 2 },
      maxWidth: "1000px",
      mx: "auto",
    }}>
      <Box sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        mb: { xs: 1.5, md: 2 },
        flexDirection: { xs: "column", sm: "row" },
        gap: { xs: 1, sm: 0 },
      }}>
        <Typography
          variant="h6"
          color="primary"
          fontWeight="bold"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <ContentCopy color="primary" />
          Extracted Text
        </Typography>
        <Button
          size="small"
          variant="outlined"
          startIcon={<ContentCopy />}
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
        slotProps={{
          input: {
            readOnly: true,
            sx: {
              borderRadius: 1.5,
              fontFamily: "monospace",
              fontSize: { xs: "0.85rem", md: "0.9rem" },
            },
          },
        }}
      />
    </Paper>
  );
};

export default ExtractedText;
