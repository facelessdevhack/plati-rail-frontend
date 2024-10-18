/* eslint-disable import/no-extraneous-dependencies */
import React from "react";
import { cva } from "class-variance-authority";
import { Input } from "antd";
import { Controller } from "react-hook-form";
import AlertIcon from "../../Common/Svgs/AlertIcon";

const input = cva(
  [
    "font-poppins text-xs font-medium text-new-black leading-4.5 rounded-md placeholder:font-poppins placeholder:text-dark-grey-text",
  ],
  {
    variants: {
      intent: {
        primary: "px-3.5 py-2.25 w-full bg-white border border-light-grey",
        login:
          "px-3.5 py-2.25 w-full bg-transparent text-black placeholder:text-black h-12",
        filter:
          "px-3.5 py-2.25 w-[312px] h-10 bg-background-grey hover:bg-background-grey",
        dropdown: "px-3 py-2 w-[192px] h-8.5 bg-background-grey",
        search:
          "px-3 py-2 w-[288px] h-10 bg-background-grey hover:bg-background-grey",
        searchHome:
          "px-3 py-2 w-full h-10 bg-background-grey hover:bg-background-grey",
        loginWhite:
          " px-3.5 py-2.25 w-full bg-transparent text-white placeholder:text-white h-12 focus:bg-transparent hover:bg-transparent",
      },
      border: {
        primary: "primary-border",
        success: "success-border",
        error: "error-border",
        none: "border-none",
      },
      placeholderText: {
        primary: "placeholder:font-light",
        filters: "placeholder:font-medium",
        filterSelected: "placeholder:text-new-black",
      },
    },
    defaultVariants: {
      intent: "primary",
      placeholderText: "primary",
      border: "primary",
    },
  }
);

const CustomInput = ({
  intent,
  border,
  placeholderText,
  placeholder,
  ...props
}) => {
  return (
    <Input
      // bordered={false}
      {...props}
      className={input({ intent, border, placeholderText })}
      placeholder={placeholder}
    />
  );
};

export const CustomInputWithController = ({ ...InputProps }) => {
  const { name, placeholder, control, formState, rules, inputType, intent } =
    InputProps;

  const {
    errors,
    // dirtyFields
  } = formState;

  // const renderBorderColor = () => {
  //   return errors[name] ? "error" : "success";
  // };

  return (
    <div className="w-full">
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field }) => (
          <CustomInput
            {...field}
            intent={intent}
            border="primary"
            // border={dirtyFields[name] ? renderBorderColor() : 'primary'}
            placeholder={placeholder}
            suffix={errors[name] ? <AlertIcon /> : null}
            type={inputType}
          />
        )}
      />
      <p
        className={`font-poppins text-xs font-light leading-4.5 mt-2 ${errors[name] ? "text-alert-red visible" : "invisible"
          }`}
      >
        {errors[name]?.message}
      </p>
    </div>
  );
};

export default CustomInput;
