import axios from "../axios";
import { toast } from "sonner";
// import { jwtDecode } from "jwt-decode";

const handleSignUp = async (data) => {
  const toastId = toast.loading("Signing up...");
  try {
    const response = await axios.post(`api/v1/auth/signup`, data);
    // console.log(response.data);
    toast.success("Signed up successfully!", {
      id: toastId,
      autoClose: 100, // Auto-close the toast after 5 seconds
    });
    return response.data;
  } catch (error) {
    if (error) {
      toast.error(`${error.response.data.message}`, {
        id: toastId,
        autoClose: 300, // Auto-close the toast after 5 seconds
      });
    }
  }
};

export default handleSignUp;
