import React, { useState, useEffect } from 'react';
import { Modal } from 'antd';
import CustomInput from '../../Core/Components/CustomInput';
import CustomButton from '../../Core/Components/CustomButton';
import { client } from '../../Utils/axiosClient';

const EditDealer = ({ visible, onClose, onSuccess, dealerData }) => {
  const [searchEmail, setSearchEmail] = useState('');
  const [dealer, setDealer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', district: '', password: '' });

  useEffect(() => {
    if (dealerData && visible) {
      setDealer(dealerData);
      setForm({ 
        name: dealerData.dealerName || '', 
        email: dealerData.email || '', 
        mobile: dealerData.mobile || '', 
        district: dealerData.district || '', 
        password: '' 
      });
      setSearchEmail(dealerData.email || '');
    }
  }, [dealerData, visible]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setDealer(null);
    try {
      const res = await client.get(`/master/dealer?email=${encodeURIComponent(searchEmail)}`);
      if (res.data && res.data.id) {
        setDealer(res.data);
        setForm({ name: res.data.name || '', email: res.data.email || '', mobile: res.data.mobile || '', district: res.data.district || '', password: '' });
      } else {
        setMessage({ type: 'error', text: 'Dealer not found.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Dealer not found.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!dealer) return;
    setLoading(true);
    setMessage(null);
    try {
      await client.post('/master/dealer', {
        id: dealer.id,
        name: form.name,
        email: form.email,
        mobile: form.mobile,
        district: form.district,
        password: form.password || undefined,
      });
      setMessage({ type: 'success', text: 'Dealer updated successfully!' });
      setForm({ ...form, password: '' });
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1500);
    } catch (err) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to update dealer.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setSearchEmail('');
    setDealer(null);
    setForm({ name: '', email: '', mobile: '', district: '', password: '' });
    setMessage(null);
    onClose();
  };

  return (
    <Modal
      title="Edit Dealer"
      open={visible}
      onCancel={handleCancel}
      footer={null}
      width={500}
    >
      {!dealerData && (
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <CustomInput
            name="searchEmail"
            placeholder="Enter Dealer Email"
            value={searchEmail}
            onChange={e => setSearchEmail(e.target.value)}
            required
          />
          <CustomButton type="submit" loading={loading}>
            Search
          </CustomButton>
        </form>
      )}
      {dealer && (
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
            placeholder="New Password (leave blank to keep current)"
            type="password"
            value={form.password}
            onChange={handleChange}
          />
          <CustomButton type="submit" loading={loading}>
            Update Dealer
          </CustomButton>
        </form>
      )}
      {message && (
        <div className={`mt-4 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.text}</div>
      )}
    </Modal>
  );
};

export default EditDealer;