import { Font } from "@react-pdf/renderer";
import NotoSansMyanmarRegular from "../../../assets/Font/NotoSansMyanmar-Regular.ttf";
import NotoSansMyanmarBold from "../../../assets/Font/NotoSansMyanmar-Bold.ttf";

let fontsRegistered = false;

const registerPdfFonts = () => {
  if (fontsRegistered) return;

  Font.register({
    family: "NotoSansMyanmar",
    fonts: [
      {
        src: NotoSansMyanmarRegular,
        fontWeight: "normal",
      },
      {
        src: NotoSansMyanmarBold,
        fontWeight: "bold",
      },
    ],
  });

  fontsRegistered = true;
};

export default registerPdfFonts;
