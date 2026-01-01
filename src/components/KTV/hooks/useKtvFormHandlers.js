import { useState } from "react";

export const useKtvFormHandlers = (initialTaxRate = 5, initialServiceFee = 2, initialDiscount = 0) => {
  const [taxRate, setTaxRate] = useState(initialTaxRate);
  const [serviceFee, setServiceFee] = useState(initialServiceFee);
  const [discountAmount, setDiscountAmount] = useState(initialDiscount);

  const handleTaxChange = (e) => {
    const value = e.target.value.replace(/^0+/, "");
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setTaxRate(value === "" ? 0 : Number(value));
    }
  };

  const handleServiceFeeChange = (e) => {
    const value = e.target.value.replace(/^0+/, "");
    if (value === "" || (Number(value) >= 0 && Number(value) <= 100)) {
      setServiceFee(value === "" ? 0 : Number(value));
    }
  };

  const handleDiscountChange = (e) => {
    const value = e.target.value.replace(/^0+/, "");
    if (value === "" || (Number(value) >= 0 && !isNaN(Number(value)))) {
      setDiscountAmount(value === "" ? 0 : Number(value));
    }
  };

  return {
    taxRate,
    serviceFee,
    discountAmount,
    handleTaxChange,
    handleServiceFeeChange,
    handleDiscountChange,
  };
};

