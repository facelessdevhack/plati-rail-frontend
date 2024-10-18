import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

function MissingRoute() {
  const { user } = useSelector((state) => state.userDetails);
  switch (user.roleId) {
    // case 1:
    //   return <Navigate to={{ pathname: "/login" }} />;
    // case 2:
    //   return <Navigate to={{ pathname: "/login" }} />;
    // case 3:
    //   return <Navigate to={{ pathname: "/login" }} />;
    // case 4:
    //   return <Navigate to={{ pathname: "/login" }} />;
    case 5:
      return <Navigate to={{ pathname: "/admin-daily-entry-dealers" }} />;
    default:
      return <Navigate to={{ pathname: "/login" }} />;
  }
}

export { MissingRoute };
