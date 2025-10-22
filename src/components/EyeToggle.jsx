import eye from "./../assets/svg/eye.svg";
import eyeoff from "./../assets/svg/eye-off.svg";
import { useState } from "react";

const EyeToggle = ({ onToggle }) => {
  const [open, setOpen] = useState(false);

  const handleToogle = () => {
    onToggle();
    setOpen(!open);
  };

  return (
    <div onClick={handleToogle}>
      {open ? <img src={eye} /> : <img src={eyeoff} />}
    </div>
  );
};

export default EyeToggle;
