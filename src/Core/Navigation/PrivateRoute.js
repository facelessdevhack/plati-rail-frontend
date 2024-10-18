import React from "react";
import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const PrivateRoute = ({ children, allowedRoles }) => {
    const { loggedIn, user } = useSelector((state) => state.userDetails);

    if (!loggedIn) {
        return <Navigate to="/login" />;
    }

    if (allowedRoles && !allowedRoles.includes(Number(user.roleId))) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default PrivateRoute;