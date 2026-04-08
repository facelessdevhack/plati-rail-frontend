import { Alert } from "antd";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { CustomInputWithController } from "../../Core/Components/CustomInput";
import { userAuthenticate } from "../../redux/api/userAPI";
import { updateUserData } from "../../redux/slices/user.slice";
import GlobalLoader from "../../Core/Components/GlobalLoader";

const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loggedIn, tryingAuth, user, error, authError } = useSelector(
    (state) => state.userDetails
  );
  const { handleSubmit, control, formState } = useForm({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    console.log(loggedIn, user);
    if (loggedIn && user.roleId === 5) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/admin-daily-entry-dealers");
      return;
    }

    if (loggedIn && user.roleId === 3) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/entry-dashboard");
      return;
    }

    if (loggedIn && user.roleId === 4) {
      console.log(JSON.stringify(user, null, 2), "USER");
      navigate("/admin-daily-entry-dealers");
      return;
    }

    if (loggedIn) {
      alert("Access Denied. Please contact the administrator for assistance.");
    }
  }, [loggedIn]);

  const onSubmit = (e) => {
    const { email, password } = e;
    if (authError) {
      dispatch(updateUserData([
        { key: 'authError', value: false },
        { key: 'error', value: null }
      ]));
    }

    dispatch(
      userAuthenticate({
        email,
        password,
      })
    );
  };

  const validationForPassword = {
    required: "please enter password",
    minLength: {
      value: 8,
      message: "less characters for password",
    },
  };

  return (
    <div className="login-page">
      <GlobalLoader visible={tryingAuth} />

      {/* Background */}
      <div className="login-bg">
        <div className="login-bg-gradient-orange" />
        <div className="login-bg-gradient-teal" />
        <div className="login-bg-noise" />
      </div>

      {/* Border lines */}
      <div className="login-border-left" />
      <div className="login-border-right" />
      <div className="login-border-top" />
      <div className="login-border-bottom" />

      {/* Form Card */}
      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-container">
          <img
            src="/assets/images/Login/plati-logo-orange.png"
            alt="Plati India"
            className="login-logo"
          />
        </div>

        {/* Welcome Text */}
        <div className="login-welcome">
          <h1 className="login-welcome-title">WELCOME BACK</h1>
          <p className="login-welcome-subtitle">Sign in to continue.</p>
        </div>

        {/* Login Form */}
        <form
          onSubmit={handleSubmit((e) => onSubmit(e))}
          className="login-form"
        >
          {/* Error Alert */}
          {authError && error && (
            <Alert
              message="Login Failed"
              description={error.message || error || "Invalid email or password. Please try again."}
              type="error"
              showIcon
              closable
              className="login-alert"
            />
          )}

          <div className="login-fields">
            <div className="login-field-group">
              <label className="login-label">Email ID</label>
              <CustomInputWithController
                control={control}
                formState={formState}
                name="email"
                placeholder="Enter Email"
                className="login-input"
              />
            </div>

            <div className="login-field-group">
              <label className="login-label">Password</label>
              <div className="login-password-wrapper">
                <CustomInputWithController
                  inputType={showPassword ? "text" : "password"}
                  control={control}
                  formState={formState}
                  name="password"
                  placeholder="Enter Password"
                  rules={validationForPassword}
                  className="login-input"
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="login-forgot-container">
            <button
              type="button"
              className="login-forgot-link"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={tryingAuth}
            className="login-submit-btn"
          >
            {tryingAuth ? "Signing In..." : "Sign In"}
          </button>

          <p className="login-copyright">
            &copy; {new Date().getFullYear()} Plati India Pvt. Ltd. All rights reserved.
          </p>
        </form>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: black;
        }

        /* Background */
        .login-bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .login-bg-gradient-orange {
          position: absolute;
          bottom: -200px;
          left: -200px;
          width: 900px;
          height: 900px;
          background: radial-gradient(ellipse at center, #f26c2d 0%, transparent 70%);
          opacity: 0.6;
          filter: blur(80px);
        }

        .login-bg-gradient-teal {
          position: absolute;
          top: -300px;
          right: -200px;
          width: 1000px;
          height: 1000px;
          background: radial-gradient(ellipse at center, #c8ddde 0%, transparent 70%);
          opacity: 0.3;
          filter: blur(80px);
        }

        .login-bg-noise {
          position: absolute;
          inset: 0;
          opacity: 0.05;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Border lines */
        .login-border-left,
        .login-border-right {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: rgba(255, 255, 255, 0.06);
        }
        .login-border-left { left: 60px; }
        .login-border-right { right: 60px; }

        .login-border-top,
        .login-border-bottom {
          position: absolute;
          left: 60px;
          right: 60px;
          height: 1px;
          background: rgba(255, 255, 255, 0.06);
        }
        .login-border-top { top: 60px; }
        .login-border-bottom { bottom: 60px; }

        /* Form Card */
        .login-card {
          position: relative;
          z-index: 10;
          width: 480px;
          max-width: calc(100% - 32px);
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 60px 56px;
          box-shadow: 0px 10px 15px -3px rgba(0, 0, 0, 0.4), 0px 4px 6px -4px rgba(0, 0, 0, 0.3);
          backdrop-filter: blur(20px);
        }

        /* Logo */
        .login-logo-container {
          display: flex;
          justify-content: center;
          margin-bottom: 32px;
        }

        .login-logo {
          height: 61px;
          width: auto;
          object-fit: contain;
        }

        /* Welcome */
        .login-welcome {
          text-align: center;
          margin-bottom: 40px;
        }

        .login-welcome-title {
          font-family: 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 400;
          letter-spacing: 4px;
          color: white;
          margin: 0 0 8px 0;
          line-height: 1;
        }

        .login-welcome-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          font-weight: 500;
          color: white;
          margin: 0;
          letter-spacing: -0.15px;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
        }

        .login-alert {
          margin-bottom: 16px;
          border-radius: 8px;
        }

        .login-fields {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-bottom: 8px;
        }

        .login-field-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .login-label {
          font-family: 'Inter', sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: white;
          line-height: 21px;
        }

        .login-input .ant-input,
        .login-input input {
          height: 44px !important;
          background: white !important;
          border: 1px solid #e5e5e5 !important;
          border-radius: 12px !important;
          padding: 10px 16px !important;
          font-size: 14px !important;
          color: black !important;
          letter-spacing: -0.15px;
        }

        .login-input .ant-input::placeholder,
        .login-input input::placeholder {
          color: rgba(0, 0, 0, 0.3) !important;
        }

        .login-input .ant-input:focus,
        .login-input input:focus {
          border-color: #f26c2d !important;
          box-shadow: 0 0 0 2px rgba(242, 108, 45, 0.15) !important;
        }

        .login-password-wrapper {
          position: relative;
        }

        .login-password-toggle {
          position: absolute;
          right: 14px;
          top: 14px;
          z-index: 2;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Forgot password */
        .login-forgot-container {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 24px;
          margin-top: 8px;
        }

        .login-forgot-link {
          background: none;
          border: none;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          font-size: 13px;
          font-weight: 400;
          color: #f55e34;
          padding: 0;
          letter-spacing: -0.08px;
          transition: opacity 0.2s;
        }

        .login-forgot-link:hover {
          opacity: 0.8;
        }

        /* Submit button */
        .login-submit-btn {
          width: 100%;
          height: 48px;
          background: #f26c2d;
          color: white;
          border: none;
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          font-size: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          line-height: 24px;
          margin-bottom: 16px;
        }

        .login-submit-btn:hover:not(:disabled) {
          background: #e05a1f;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(242, 108, 45, 0.4);
        }

        .login-submit-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .login-submit-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        /* Copyright */
        .login-copyright {
          font-family: 'Inter', sans-serif;
          font-size: 12px;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.5);
          text-align: center;
          margin: 0;
          line-height: 24px;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .login-card {
            padding: 40px 24px;
            width: calc(100% - 32px);
          }

          .login-border-left,
          .login-border-right,
          .login-border-top,
          .login-border-bottom {
            display: none;
          }

          .login-welcome-title {
            font-size: 20px;
            letter-spacing: 3px;
          }

          .login-submit-btn {
            font-size: 18px;
            height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default Login;
