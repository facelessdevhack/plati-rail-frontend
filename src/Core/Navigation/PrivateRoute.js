import React, { useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { isTokenExpired, handleSessionExpired } from "../../Utils/session";

const PrivateRoute = ({ children, allowedRoles, allowedPermissions }) => {
    const { loggedIn, user } = useSelector((state) => state.userDetails);
    const location = useLocation();

    // redux-persist can claim "logged in" long after the JWT expired (e.g.
    // reopening the app the next day). Catch the dead token here, before the
    // page renders and the first API call ejects the user mid-work.
    const staleSession = loggedIn && isTokenExpired();

    useEffect(() => {
        if (staleSession) {
            handleSessionExpired(location.pathname + location.search);
        }
    }, [staleSession, location.pathname, location.search]);

    if (staleSession) {
        return null;
    }

    if (!loggedIn) {
        // Carry the blocked destination so login can return the user here.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const roleAllowed = allowedRoles?.includes(Number(user.roleId)) || false;
    const grantedPermissions = new Set(user.permissions || []);
    const permissionAllowed =
        Number(user.roleId) === 999 ||
        allowedPermissions?.some(permission => grantedPermissions.has(permission)) ||
        false;

    // When both mechanisms are supplied, either one may authorize the page. This
    // keeps old sessions and legacy role routes working while screens migrate to
    // named permissions.
    if ((allowedRoles || allowedPermissions) && !roleAllowed && !permissionAllowed) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

export default PrivateRoute;
