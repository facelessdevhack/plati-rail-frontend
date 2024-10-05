import React from "react";
import { useNavigate } from "react-router-dom";

const AlertItemsList = () => {
  const navigate = useNavigate();
  return (
    <div>
      <div>This is Alert Items List Page</div>
      <button onClick={() => navigate("/admin-alerts-details")}>
        Go To Details
      </button>
    </div>
  );
};

export default AlertItemsList;
