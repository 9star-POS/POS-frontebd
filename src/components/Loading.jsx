import React from "react";
import ReactLoading from "react-loading";

function Loading({ type, color }) {
  return (
    <div className="flex w-full justify-center items-center">
      <ReactLoading
        type="balls"
        color="#2b2f33"
        height={"3%"}
        width={"4%"}
        className="mt-[200px] md:mt-0"
      />
    </div>
  );
}

export default Loading;
