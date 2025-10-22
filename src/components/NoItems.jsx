import React from "react";
import box from "./../assets/box.png";

function NoItems({ header, subHeader }) {
  return (
    <div>
      <div className="flex flex-col items-center justify-center">
        <img src={box} alt="box" />
        <p className="sub-header">{header}</p>
        <span className="text-gray-500">{subHeader}</span>
      </div>
    </div>
  );
}

export default NoItems;
