import { useNavigate } from "react-router-dom";
import logo from "./../assets/lgoo.png";
import welcome from "./../assets/welcome.svg";
import { motion } from "framer-motion";
import { useEffect } from "react";

function Welcome() {
  const navigate = useNavigate();
  // Define animation variants
  const logoVariants = {
    hidden: { opacity: 0, y: -50 },
    visible: { opacity: 1, y: 0 },
  };

  const textVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  };

  useEffect(() => {
    setTimeout(() => {
      navigate("/login");
    }, 2000);
  }, []);

  return (
    <div>
      <div className="flex w-full bg-white lg:bg-screen h-screen justify-center items-center overflow-y-auto relative">
        <motion.div
          className="absolute top-0 left-0"
          initial="hidden"
          animate="visible"
          variants={logoVariants}
          transition={{ duration: 0.5 }}
        >
          <img src={logo} alt="logo" className="w-20 h-20" />
        </motion.div>
        <motion.div
          className="bg-white w-full md:w-[450px] flex flex-col justify-center items-center px-10 lg:pb-10 md:shadow-md rounded-2xl md:border-2 border-gray-200"
          initial="hidden"
          animate="visible"
          variants={textVariants}
          transition={{ duration: 0.5, delay: 0.3 }} // Adding a slight delay for the text
        >
          <img src={welcome} alt="welcome" className="" />
          <p className="sub-header">Congratulation!</p>
          <p>Your Shop is now open in BIZ BOZZ!</p>
          {/* <button
            onClick={() => navigate("/login")}
            className="w-full mt-4 bg-primary text-white font-bold py-4 rounded hover:bg-blue-600 transition duration-200"
          >
            
          </button> */}
        </motion.div>
      </div>
    </div>
  );
}

export default Welcome;
