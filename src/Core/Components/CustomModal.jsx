import React from "react";
import { Modal } from "antd";

const CustomModal = ({
  setIsModalOpen,
  isModalOpen,
  title,
  children,
  handleOk,
}) => {
  const handleCancel = () => {
    setIsModalOpen(false);
  };
  return (
    <Modal
      destroyOnClose={true}
      title={title}
      open={isModalOpen}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      {children}
    </Modal>
  );
};

export default CustomModal;
