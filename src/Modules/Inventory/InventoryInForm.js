import { Col, Row } from "antd";
import React from "react";
import { useForm } from "react-hook-form";
// import { useNavigate } from "react-router-dom";
import { CustomInputWithController } from "../../Core/Components/CustomInput";
import Button from "../../Core/Components/CustomButton";
import { client } from "../../Utils/axiosClient";

const InventoryInForm = () => {
  // const navigate = useNavigate();
  const {
    handleSubmit,
    control,
    formState,
    // setError
  } = useForm({
    alloyId: "",
    quantity: "",
  });

  const onSubmit = async (e) => {
    const { alloyId, quantity } = e;
    try {
      const response = await client.post(
        `${process.env.REACT_APP_API_URL}/v2/inventory/add-inventory`,
        {
          alloyId,
          quantity,
        }
      );
      if (response.data.token) {
        // const userDetailsTemp = response.data;
        // dispatch(
        //   updateLoggedInUser({ key: 'userDetails', value: userDetailsTemp }),
        // );
        // localStorage.setItem('token', response.data.token);
        // navigate('/home');
        console.log(response, "This is the Add Inventory");
      }
    } catch (error) {
      // setError(error.response.data.type, {
      //   type: 'server',
      //   message: error.response.data.message,
      // });
      console.error(error, "Login Error");
    }
  };

  return (
    <div className="w-screen h-screen">
      <Row className="items-center justify-center w-full h-full lg:flex">
        <Col
          span={15}
          className="items-center justify-center hidden h-full overflow-hidden lg:flex"
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
            lg: 9,
          }}
        >
          <div className="flex flex-col items-center justify-center w-full h-full gap-y-6 font-poppins">
            <img src="/assets/logo.png" alt="Plati India" />
            {/* <div>
              <div className="text-2xl font-medium leading-9 text-center text-new-black">
                Welcome
              </div>
              <div className="mt-2 text-xs font-light leading-4.5 text-center text-dark-grey-text">
                Login to continue to dashboard
              </div>
            </div> */}

            <form
              onSubmit={handleSubmit((e) => onSubmit(e))}
              className="flex flex-col items-center justify-center w-full gap-y-6"
            >
              <CustomInputWithController
                control={control}
                formState={formState}
                name="quantity"
                placeholder="Quantity"
                inputType="number"
              />
              <CustomInputWithController
                control={control}
                formState={formState}
                name="Apple"
                placeholder="Apple"
                inputType="number"
              />
              <select>
                <option>PY-009</option>
                <option>PY-010</option>
                <option>PY-011</option>
                <option>PY-012</option>
                <option>PY-013</option>
                <option>PY-015</option>
                <option>PY-016</option>
              </select>

              <select>
                <option>14x110</option>
                <option>14x100 4 Hole</option>
                <option>14x110</option>
                <option>14x110</option>
                <option>14x110</option>
                <option>14x110</option>
                <option>14x110</option>
              </select>

              {/* <CustomInputWithController
                inputType="password"
                control={control}
                formState={formState}
                name="password"
                placeholder="Password"
              /> */}
              <Button type="submit" width="login">
                Add To Inventory
              </Button>
            </form>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default InventoryInForm;
