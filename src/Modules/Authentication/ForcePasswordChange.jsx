import React, { useState } from 'react'
import { Alert, Form, Input, message, Modal } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { client, getError } from '../../Utils/axiosClient'
import { mergeAuthenticatedUser } from '../../redux/slices/user.slice'

const ForcePasswordChange = () => {
  const dispatch = useDispatch()
  const user = useSelector(state => state.userDetails.user)
  const [form] = Form.useForm()
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    try {
      const values = await form.validateFields()
      setSaving(true)
      await client.post('/rbac/me/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      })
      const updatedUser = { ...user, forcePasswordChange: false }
      dispatch(mergeAuthenticatedUser({ forcePasswordChange: false }))
      localStorage.setItem('user', JSON.stringify(updatedUser))
      message.success('Password changed successfully')
      form.resetFields()
    } catch (error) {
      if (!error?.errorFields) message.error(getError(error).message || 'Could not change password')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      title='Change your temporary password'
      open={Boolean(user?.forcePasswordChange)}
      closable={false}
      maskClosable={false}
      keyboard={false}
      okText='Change password'
      onOk={submit}
      confirmLoading={saving}
      cancelButtonProps={{ style: { display: 'none' } }}
    >
      <Alert
        type='info'
        showIcon
        message='Your administrator issued a temporary password. Set a private password before continuing.'
        style={{ marginBottom: 16 }}
      />
      <Form form={form} layout='vertical'>
        <Form.Item name='currentPassword' label='Temporary password' rules={[{ required: true }]}>
          <Input.Password autoComplete='current-password' />
        </Form.Item>
        <Form.Item
          name='newPassword'
          label='New password'
          rules={[
            { required: true, min: 10 },
            { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, message: 'Use uppercase, lowercase and numeric characters.' }
          ]}
        >
          <Input.Password autoComplete='new-password' />
        </Form.Item>
        <Form.Item
          name='confirmPassword'
          label='Confirm new password'
          dependencies={['newPassword']}
          rules={[
            { required: true },
            ({ getFieldValue }) => ({
              validator (_, value) {
                return !value || getFieldValue('newPassword') === value
                  ? Promise.resolve()
                  : Promise.reject(new Error('Passwords do not match.'))
              }
            })
          ]}
        >
          <Input.Password autoComplete='new-password' />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export default ForcePasswordChange
