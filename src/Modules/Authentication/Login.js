import { Col, Row } from "antd";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CustomInputWithController } from "../../Core/Components/CustomInput";
import Button from "../../Core/Components/CustomButton";
import { userAuthenticate } from "../../redux/api/userAPI";
import GlobalLoader from "../../Core/Components/GlobalLoader";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loggedIn, tryingAuth, user } = useSelector(
    (state) => state.userDetails
  );
  const { handleSubmit, control, formState } = useForm({
    email: "",
    password: "",
  });

  useEffect(() => {
    console.log(loggedIn, user);
    // Redirect to inventory dashboard if user is logged in and has user ID 5
    if (loggedIn && user.roleId === 5) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/admin-daily-entry-dealers");
      return; // Exit early to prevent further execution
    }

    if (loggedIn && user.roleId === 3) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/entry-dashboard");
      return; // Exit early to prevent further execution
    }

    if (loggedIn && user.roleId === 4) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/admin-daily-entry-dealers");
      return; // Exit early to prevent further execution
    }

    // Display access denied message if user is logged in but does not have user ID 5
    if (loggedIn) {
      alert("Access Denied. Please contact the administrator for assistance.");
    }
  }, [loggedIn]);

  const onSubmit = async (e) => {
    const { email, password } = e;
    try {
      dispatch(
        userAuthenticate({
          email,
          password,
        })
      );
    } catch (error) {
      // setError(error.response.data.type, {
      //   type: 'server',
      //   message: error.response.data.message,
      // });
      console.error(error, "Login Error");
      alert("Login Error", error);
    }
  };

  // const validationForEmail = {
  //   required: "please enter email address",
  //   pattern: {
  //     value: /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
  //     message: "Enter a vaild email",
  //   },
  // };

  const validationForPassword = {
    required: "please enter password",
    minLength: {
      value: 8,
      message: "less characters for password",
    },
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary relative overflow-hidden">
      <GlobalLoader visible={tryingAuth} />
      
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
      <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
      
      <Row className="min-h-screen items-center justify-center">
        {/* Left Side - Image */}
        <Col
          xs={0}
          md={14}
          lg={16}
          className="hidden md:flex items-center justify-center h-screen relative"
        >
          <div className="relative z-10 max-w-2xl">
            <img
              src="/assets/images/Login/login.jpg"
              alt="Plati Rail System"
              className="w-full h-auto rounded-2xl shadow-2xl object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent rounded-2xl" />
          </div>
        </Col>

        {/* Right Side - Login Form */}
        <Col
          xs={24}
          md={10}
          lg={8}
          className="flex items-center justify-center min-h-screen p-8"
        >
          <div className="w-full max-w-md relative z-10">
            {/* Glass Card */}
            <div className="glass rounded-3xl p-8 shadow-2xl backdrop-blur-xl border border-white/20">
              {/* Logo */}
              <div className="flex justify-center mb-8">
                <img 
                  src="/assets/logo.png" 
                  alt="Plati India" 
                  className="h-12 w-auto"
                />
              </div>

              {/* Welcome Text */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Welcome Back
                </h1>
                <p className="text-white/80 text-sm">
                  Sign in to access your dashboard
                </p>
              </div>

              {/* Login Form */}
              <form
                onSubmit={handleSubmit((e) => onSubmit(e))}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <CustomInputWithController
                    control={control}
                    formState={formState}
                    name="email"
                    placeholder="Email Address"
                    variant="loginWhite"
                    size="lg"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:border-white focus:ring-white/20"
                  />

                  <CustomInputWithController
                    inputType="password"
                    control={control}
                    formState={formState}
                    name="password"
                    placeholder="Password"
                    variant="loginWhite"
                    size="lg"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/70 focus:border-white focus:ring-white/20"
                  />
                </div>

                <Button 
                  type="submit" 
                  variant="gradient"
                  size="lg"
                  width="full"
                  loading={tryingAuth}
                  className="w-full h-12 text-base font-semibold shadow-xl hover:shadow-2xl"
                >
                  {tryingAuth ? "Signing In..." : "Sign In"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    className="text-white/80 hover:text-white text-sm font-medium hover:underline transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="text-center mt-8">
              <p className="text-white/60 text-xs">
                © {new Date().getFullYear()} Plati India Pvt. Ltd. All rights reserved.
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
