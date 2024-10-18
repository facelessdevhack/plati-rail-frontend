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

  const validationForEmail = {
    required: "please enter email address",
    pattern: {
      value: /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/,
      message: "Enter a vaild email",
    },
  };

  const validationForPassword = {
    required: "please enter password",
    minLength: {
      value: 8,
      message: "less characters for password",
    },
  };
  return (
    <div className="w-screen h-screen">
      <GlobalLoader visible={tryingAuth} />
      <Row className="items-center justify-center w-full h-full md:flex">
        <Col
          span={15}
          className="items-center justify-center h-full overflow-hidden xs:hidden md:flex"
        >
          <img
            src="/assets/images/Login/login.jpg"
            alt="LoginImage"
            className="object-contain w-[600px] h-full"
          />
        </Col>
        <Col
          span={{
            xs: 24,
            md: 9,
          }}
        >
          <div className="relative z-10 flex flex-col items-center justify-center w-full h-full p-20 gap-y-6 font-poppins">
            <div className="absolute z-0 w-full h-full bg-black border border-gray-300 rounded-lg opacity-80" />
            <img className="z-10" src="/assets/logo.png" alt="Plati India" />
            <div className="z-10">
              <div className="text-2xl font-medium leading-9 text-center text-white">
                Welcome
              </div>
              <div className="mt-2 text-xs font-light leading-4.5 text-center text-white">
                Login to continue to dashboard
              </div>
            </div>

            <form
              onSubmit={handleSubmit((e) => onSubmit(e))}
              className="z-10 flex flex-col items-center justify-center w-full gap-y-6"
            >
              <CustomInputWithController
                control={control}
                formState={formState}
                name="email"
                placeholder="Email Address"
                rules={validationForEmail}
                intent="loginWhite"
              />

              <CustomInputWithController
                inputType="password"
                control={control}
                formState={formState}
                name="password"
                placeholder="Password"
                rules={validationForPassword}
                intent="loginWhite"
                isPassword={true}
              />
              <Button type="submit" width="login">
                Login
              </Button>
              <button
                type="button"
                // onClick={() => navigate('/reset-password')}
                // onClick={() => <SetNewPassword />}
                className="cursor-pointer font-poppins font-light text-xs leading-4.5 text-white hover:text-white hover:underline"
              >
                Reset Password
              </button>
            </form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
