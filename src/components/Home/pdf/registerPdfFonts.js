import { Font } from "@react-pdf/renderer";

let fontsRegistered = false;

const registerPdfFonts = () => {
  if (fontsRegistered) return;

  Font.register({
    family: "NotoSansMyanmar",
    fonts: [
      {
        src: "https://fonts.gstatic.com/s/notosansmyanmar/v13/ZGhIjOwIsZRM0bbLB8N0Mbv9M18-RJW4nxaYHjY.ttf",
        fontWeight: "normal",
      },
      {
        src: "https://fonts.gstatic.com/s/notosansmyanmar/v13/ZGhKjOwIsZRM0bbLB8N0Mbv9M18ydJaiuAeqJDs0s_c.ttf",
        fontWeight: "bold",
      },
    ],
  });

  fontsRegistered = true;
};

export default registerPdfFonts;

