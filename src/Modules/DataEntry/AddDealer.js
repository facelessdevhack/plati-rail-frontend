import React, { useState } from 'react';
import { Modal } from 'antd';
import CustomInput from '../../Core/Components/CustomInput';
import CustomButton from '../../Core/Components/CustomButton';
import { client } from '../../Utils/axiosClient';

const AddDealer = ({ visible, onClose, onSuccess }) => {
  const [form, setForm] = useState({ name: '', email: '', mobile: '', district: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const res = await client.post('/master/dealer', {
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        district: form.district,
        password: form.password,
        roleId: 2,
      });
      setMessage({ type: 'success', text: 'Dealer added successfully!' });
      setForm({ name: '', email: '', mobile: '', district: '', password: '' });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to add dealer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', email: '', mobile: '', district: '', password: '' });
    setMessage(null);
    onClose();
  };

  return (
    <Modal
      title="Add Dealer"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <CustomInput
          name="name"
          placeholder="Dealer Name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <CustomInput
          name="email"
          placeholder="Email"
          type="email"
          value={form.email}
          onChange={handleChange}
        />
        <CustomInput
          name="mobile"
          placeholder="Mobile Number"
          type="tel"
          value={form.mobile}
          onChange={handleChange}
          required
        />
        <CustomInput
          name="district"
          placeholder="District"
          value={form.district}
          onChange={handleChange}
          required
        />
        <CustomInput
          name="password"
          placeholder="Password"
          type="password"
          value={form.password}
          onChange={handleChange}
          required
        />
        <CustomButton type="submit" loading={loading}>
          Add Dealer
        </CustomButton>
      </form>
      {message && (
        <div className={`mt-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</div>
      )}
    </Modal>
  );
};

export default AddDealer;