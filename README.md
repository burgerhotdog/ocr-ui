# Image to Text Converter (OCR)

A modern web application that allows users to extract text from images using OCR (Optical Character Recognition). Built with React, Material-UI, and the OCR.Space API.

## Features

- Upload images or paste image URLs
- Interactive image cropping
- Text extraction using OCR
- Copy extracted text to clipboard
- Responsive design
- Modern UI with Material-UI components

## Technologies Used

- React 19
- Vite
- Material-UI
- react-image-crop
- OCR.Space API

## Getting Started

1. Clone the repository
```bash
git clone [your-repo-url]
cd [repo-name]
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Build for production
```bash
npm run build
```

## Environment Variables

The application uses the OCR.Space API. You'll need to replace the API key in `src/App.jsx` with your own key from [OCR.Space](https://ocr.space/ocrapi).

## License

MIT
