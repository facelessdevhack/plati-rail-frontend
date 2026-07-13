import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  message,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd'
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  KeyOutlined,
  LockOutlined,
  PlusOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  SearchOutlined,
  TeamOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import { client, getError } from '../../Utils/axiosClient'

const { Title, Text, Paragraph } = Typography
const STATUS_COLORS = { active: 'green', inactive: 'default', suspended: 'orange' }

const temporaryPassword = () => {
  const bytes = new Uint32Array(3)
  window.crypto.getRandomValues(bytes)
  return `Plati#${Array.from(bytes).map(value => value.toString(36)).join('').slice(0, 10)}A1`
}

const AccessControl = () => {
  const currentUser = useSelector(state => state.userDetails.user)
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [userModal, setUserModal] = useState({ open: false, user: null })
  const [roleModal, setRoleModal] = useState({ open: false, role: null })
  const [passwordModal, setPasswordModal] = useState({ open: false, user: null })
  const [filters, setFilters] = useState({ search: '', status: undefined, roleId: undefined })
  const [userPagination, setUserPagination] = useState({ current: 1, pageSize: 25, total: 0 })
  const [auditPagination, setAuditPagination] = useState({ current: 1, pageSize: 25, total: 0 })
  const [userForm] = Form.useForm()
  const [roleForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  const permissionSet = useMemo(() => new Set(currentUser.permissions || []), [currentUser.permissions])
  const can = permission => Number(currentUser.roleId) === 999 || permissionSet.has(permission)
  const isSuperAdmin = Number(currentUser.roleId) === 999

  const showError = error => message.error(getError(error).message || 'Request failed')

  const loadUsers = useCallback(async (page = userPagination.current, pageSize = userPagination.pageSize) => {
    const response = await client.get('/rbac/users', {
      params: { page, limit: pageSize, ...filters },
      silent: true
    })
    setUsers(response.data.users)
    setUserPagination({ current: page, pageSize, total: response.data.pagination.total })
  }, [filters, userPagination.current, userPagination.pageSize])

  const loadRolesAndPermissions = useCallback(async () => {
    const [roleResponse, permissionResponse] = await Promise.all([
      client.get('/rbac/roles', { silent: true }),
      client.get('/rbac/permissions', { silent: true })
    ])
    setRoles(roleResponse.data.roles)
    setPermissions(permissionResponse.data.permissions)
  }, [])

  const loadAudit = useCallback(async (page = auditPagination.current, pageSize = auditPagination.pageSize) => {
    if (!can('system.audit')) return
    const response = await client.get('/rbac/audit', { params: { page, limit: pageSize }, silent: true })
    setAuditLogs(response.data.logs)
    setAuditPagination({ current: page, pageSize, total: response.data.pagination.total })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auditPagination.current, auditPagination.pageSize, currentUser.roleId, currentUser.permissions])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      await Promise.all([loadUsers(), loadRolesAndPermissions(), loadAudit()])
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadUsers, loadRolesAndPermissions, loadAudit])

  useEffect(() => { refresh() }, [refresh])

  const openUserModal = user => {
    setUserModal({ open: true, user: user || null })
    userForm.resetFields()
    if (user) {
      userForm.setFieldsValue({
        firstName: user.firstname,
        lastName: user.lastname,
        email: user.email,
        roleId: user.roleId,
        status: user.status
      })
    } else {
      userForm.setFieldsValue({ status: 'active', forcePasswordChange: true, password: temporaryPassword() })
    }
  }

  const saveUser = async () => {
    try {
      const values = await userForm.validateFields()
      setLoading(true)
      if (userModal.user) {
        await client.patch(`/rbac/users/${userModal.user.userId}`, values)
        message.success('User updated')
      } else {
        await client.post('/rbac/users', values)
        message.success('User created')
      }
      setUserModal({ open: false, user: null })
      await Promise.all([loadUsers(1), loadRolesAndPermissions(), loadAudit(1)])
    } catch (error) {
      if (!error?.errorFields) showError(error)
    } finally {
      setLoading(false)
    }
  }

  const deactivate = async user => {
    try {
      setLoading(true)
      await client.delete(`/rbac/users/${user.userId}`)
      message.success('User deactivated; historical records were preserved')
      await Promise.all([loadUsers(), loadRolesAndPermissions(), loadAudit(1)])
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  const openPasswordModal = user => {
    setPasswordModal({ open: true, user })
    passwordForm.resetFields()
    passwordForm.setFieldsValue({ password: temporaryPassword(), forcePasswordChange: true })
  }

  const resetPassword = async () => {
    try {
      const values = await passwordForm.validateFields()
      setLoading(true)
      await client.post(`/rbac/users/${passwordModal.user.userId}/reset-password`, values)
      message.success('Temporary password set')
      setPasswordModal({ open: false, user: null })
      await loadAudit(1)
    } catch (error) {
      if (!error?.errorFields) showError(error)
    } finally {
      setLoading(false)
    }
  }

  const permissionGroups = useMemo(() => permissions.reduce((groups, permission) => {
    const moduleName = permission.module || 'other'
    if (!groups[moduleName]) groups[moduleName] = []
    groups[moduleName].push(permission)
    return groups
  }, {}), [permissions])

  const openRoleModal = (role, clone = false) => {
    setRoleModal({ open: true, role: clone ? null : role || null })
    roleForm.resetFields()
    if (role) {
      roleForm.setFieldsValue({
        roleName: clone ? `${role.roleName} Copy` : role.roleName,
        description: role.description,
        permissionIds: role.permissions.map(permission => permission.id),
        isActive: role.isActive
      })
    } else {
      roleForm.setFieldsValue({ permissionIds: [], isActive: true })
    }
  }

  const saveRole = async () => {
    try {
      const values = await roleForm.validateFields()
      setLoading(true)
      if (roleModal.role) {
        await client.patch(`/rbac/roles/${roleModal.role.id}`, values)
        message.success('Role updated')
      } else {
        await client.post('/rbac/roles', values)
        message.success('Role created')
      }
      setRoleModal({ open: false, role: null })
      await Promise.all([loadRolesAndPermissions(), loadAudit(1)])
    } catch (error) {
      if (!error?.errorFields) showError(error)
    } finally {
      setLoading(false)
    }
  }

  const deleteRole = async role => {
    try {
      setLoading(true)
      await client.delete(`/rbac/roles/${role.id}`)
      message.success('Role deleted')
      await Promise.all([loadRolesAndPermissions(), loadAudit(1)])
    } catch (error) {
      showError(error)
    } finally {
      setLoading(false)
    }
  }

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (_, record) => (
        <Space direction='vertical' size={0}>
          <Text strong>{record.firstname} {record.lastname}</Text>
          <Text type='secondary'>{record.email}</Text>
        </Space>
      )
    },
    { title: 'Role', dataIndex: 'roleName', render: value => value || <Text type='danger'>Missing role</Text> },
    { title: 'Status', dataIndex: 'status', width: 110, render: value => <Tag color={STATUS_COLORS[value]}>{value?.toUpperCase()}</Tag> },
    { title: 'Last login', dataIndex: 'lastLogin', render: value => value ? new Date(value).toLocaleString() : 'Never' },
    {
      title: 'Actions',
      width: 190,
      render: (_, record) => {
        const protectedTarget = Number(record.roleId) === 999 && !isSuperAdmin
        const isSelf = Number(record.userId) === Number(currentUser.userId || currentUser.id)
        return (
          <Space>
            <Tooltip title='Edit user'>
              <Button icon={<EditOutlined />} disabled={!can('users.manage') || protectedTarget} onClick={() => openUserModal(record)} />
            </Tooltip>
            <Tooltip title='Reset password'>
              <Button icon={<KeyOutlined />} disabled={!can('users.reset_password') || protectedTarget} onClick={() => openPasswordModal(record)} />
            </Tooltip>
            {record.status === 'active' && (
              <Popconfirm title='Deactivate this user?' description='Historical records will remain linked to the account.' onConfirm={() => deactivate(record)}>
                <Tooltip title={isSelf ? 'You cannot deactivate yourself' : 'Deactivate user'}>
                  <Button danger icon={<DeleteOutlined />} disabled={!can('users.delete') || protectedTarget || isSelf} />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ]

  const roleColumns = [
    {
      title: 'Role',
      key: 'role',
      render: (_, role) => (
        <Space direction='vertical' size={0}>
          <Space><Text strong>{role.roleName}</Text>{role.isSystem && <Tag color='blue'>SYSTEM</Tag>}</Space>
          <Text type='secondary'>{role.description || 'No description'}</Text>
        </Space>
      )
    },
    { title: 'Users', dataIndex: 'userCount', width: 90, align: 'center' },
    { title: 'Permissions', render: (_, role) => <Tag color='geekblue'>{role.permissions.length}</Tag>, width: 120 },
    { title: 'Status', dataIndex: 'isActive', width: 100, render: value => <Tag color={value ? 'green' : 'default'}>{value ? 'ACTIVE' : 'INACTIVE'}</Tag> },
    {
      title: 'Actions',
      width: 180,
      render: (_, role) => {
        const canEdit = can('roles.manage') && (!role.isSystem || isSuperAdmin) && Number(role.id) !== 999
        return (
          <Space>
            <Tooltip title='Edit role'><Button icon={<EditOutlined />} disabled={!canEdit} onClick={() => openRoleModal(role)} /></Tooltip>
            <Tooltip title='Clone role'><Button icon={<CopyOutlined />} disabled={!can('roles.manage')} onClick={() => openRoleModal(role, true)} /></Tooltip>
            {!role.isSystem && (
              <Popconfirm title='Delete this role?' onConfirm={() => deleteRole(role)}>
                <Button danger icon={<DeleteOutlined />} disabled={!can('roles.manage') || Number(role.userCount) > 0} />
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ]

  const auditColumns = [
    { title: 'When', dataIndex: 'createdAt', width: 180, render: value => new Date(value).toLocaleString() },
    { title: 'Actor', render: (_, row) => `${row.firstname || ''} ${row.lastname || ''}`.trim() || row.actorEmail || 'System' },
    { title: 'Action', dataIndex: 'action', render: value => <Tag color='blue'>{value.replace('RBAC_', '').replaceAll('_', ' ')}</Tag> },
    { title: 'Target', render: (_, row) => `${row.resourceType || 'Resource'} #${row.resourceId || '—'}` },
    {
      title: 'Change',
      render: (_, row) => (
        <Text code style={{ whiteSpace: 'normal' }}>
          {JSON.stringify(row.newValues || row.oldValues || {})}
        </Text>
      )
    }
  ]

  const usersTab = (
    <Card>
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <Row gutter={[12, 12]} justify='space-between'>
          <Col flex='auto'>
            <Space wrap>
              <Input
                allowClear
                prefix={<SearchOutlined />}
                placeholder='Search name or email'
                value={filters.search}
                onChange={event => setFilters({ ...filters, search: event.target.value })}
                onPressEnter={() => loadUsers(1)}
                style={{ width: 260 }}
              />
              <Select allowClear placeholder='Status' value={filters.status} onChange={status => setFilters({ ...filters, status })} style={{ width: 140 }} options={['active', 'inactive', 'suspended'].map(value => ({ value, label: value }))} />
              <Select allowClear showSearch optionFilterProp='label' placeholder='Role' value={filters.roleId} onChange={roleId => setFilters({ ...filters, roleId })} style={{ width: 200 }} options={roles.filter(role => role.isActive).map(role => ({ value: role.id, label: role.roleName }))} />
              <Button onClick={() => loadUsers(1)}>Apply</Button>
            </Space>
          </Col>
          <Col><Button type='primary' icon={<UserAddOutlined />} disabled={!can('users.manage')} onClick={() => openUserModal()}>Create user</Button></Col>
        </Row>
        <Table
          rowKey='userId'
          columns={userColumns}
          dataSource={users}
          loading={loading}
          pagination={userPagination}
          onChange={pagination => loadUsers(pagination.current, pagination.pageSize)}
          scroll={{ x: 900 }}
        />
      </Space>
    </Card>
  )

  const rolesTab = (
    <Card>
      <Space direction='vertical' size='middle' style={{ width: '100%' }}>
        <Row justify='space-between' align='middle'>
          <Col><Paragraph type='secondary' style={{ margin: 0 }}>Roles bundle named application permissions. System roles are protected from accidental deletion.</Paragraph></Col>
          <Col><Button type='primary' icon={<PlusOutlined />} disabled={!can('roles.manage')} onClick={() => openRoleModal()}>Create role</Button></Col>
        </Row>
        <Table rowKey='id' columns={roleColumns} dataSource={roles} loading={loading} pagination={false} scroll={{ x: 800 }} />
      </Space>
    </Card>
  )

  const auditTab = can('system.audit') ? (
    <Card>
      <Table
        rowKey='id'
        columns={auditColumns}
        dataSource={auditLogs}
        loading={loading}
        pagination={auditPagination}
        onChange={pagination => loadAudit(pagination.current, pagination.pageSize)}
        scroll={{ x: 1000 }}
      />
    </Card>
  ) : <Alert type='info' showIcon message='Audit access is not assigned to your role.' />

  return (
    <div style={{ padding: 24 }}>
      <Row justify='space-between' align='middle' gutter={[16, 16]}>
        <Col>
          <Title level={2} style={{ marginBottom: 4 }}><SafetyCertificateOutlined /> Access Control</Title>
          <Text type='secondary'>Manage users, roles, permissions and administrative audit history.</Text>
        </Col>
        <Col><Button icon={<ReloadOutlined />} onClick={refresh} loading={loading}>Refresh</Button></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ margin: '20px 0' }}>
        <Col xs={24} sm={8}><Card><Statistic title='Users' value={userPagination.total} prefix={<TeamOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title='Active roles' value={roles.filter(role => role.isActive).length} prefix={<SafetyCertificateOutlined />} /></Card></Col>
        <Col xs={24} sm={8}><Card><Statistic title='Permissions' value={permissions.length} prefix={<LockOutlined />} /></Card></Col>
      </Row>

      <Tabs items={[
        { key: 'users', label: 'Users', children: usersTab },
        { key: 'roles', label: 'Roles & permissions', children: rolesTab },
        { key: 'audit', label: 'Audit log', children: auditTab }
      ]} />

      <Modal
        title={userModal.user ? 'Edit user' : 'Create user'}
        open={userModal.open}
        onCancel={() => setUserModal({ open: false, user: null })}
        onOk={saveUser}
        confirmLoading={loading}
        destroyOnClose
      >
        <Form form={userForm} layout='vertical'>
          <Row gutter={12}>
            <Col span={12}><Form.Item name='firstName' label='First name' rules={[{ required: true }]}><Input maxLength={100} /></Form.Item></Col>
            <Col span={12}><Form.Item name='lastName' label='Last name' rules={[{ required: true }]}><Input maxLength={100} /></Form.Item></Col>
          </Row>
          <Form.Item name='email' label='Email' rules={[{ required: true, type: 'email' }]}><Input maxLength={255} /></Form.Item>
          <Form.Item name='roleId' label='Role' rules={[{ required: true }]}>
            <Select showSearch optionFilterProp='label' options={roles.filter(role => role.isActive && (isSuperAdmin || Number(role.id) !== 999)).map(role => ({ value: role.id, label: role.roleName }))} />
          </Form.Item>
          {userModal.user ? (
            <Form.Item name='status' label='Status' rules={[{ required: true }]}><Select options={['active', 'inactive', 'suspended'].map(value => ({ value, label: value }))} /></Form.Item>
          ) : (
            <>
              <Form.Item name='password' label='Temporary password' rules={[{ required: true, min: 10 }]} extra='Requires uppercase, lowercase and numeric characters.'>
                <Input.Password addonAfter={<Button type='text' size='small' onClick={() => userForm.setFieldValue('password', temporaryPassword())}>Generate</Button>} />
              </Form.Item>
              <Form.Item name='forcePasswordChange' label='Require password change' valuePropName='checked'><Switch /></Form.Item>
            </>
          )}
        </Form>
      </Modal>

      <Modal
        title={roleModal.role ? 'Edit role' : 'Create role'}
        open={roleModal.open}
        onCancel={() => setRoleModal({ open: false, role: null })}
        onOk={saveRole}
        confirmLoading={loading}
        width={760}
        destroyOnClose
      >
        <Form form={roleForm} layout='vertical'>
          <Form.Item name='roleName' label='Role name' rules={[{ required: true }]}><Input maxLength={100} /></Form.Item>
          <Form.Item name='description' label='Description'><Input.TextArea maxLength={1000} rows={2} showCount /></Form.Item>
          {roleModal.role && <Form.Item name='isActive' label='Active' valuePropName='checked'><Switch /></Form.Item>}
          <Form.Item name='permissionIds' label='Permissions'>
            <Checkbox.Group style={{ width: '100%' }}>
              <Space direction='vertical' size='middle' style={{ width: '100%' }}>
                {Object.entries(permissionGroups).map(([moduleName, modulePermissions]) => (
                  <Card key={moduleName} size='small' title={moduleName.toUpperCase()}>
                    <Row gutter={[8, 10]}>
                      {modulePermissions.map(permission => (
                        <Col xs={24} md={12} key={permission.id}>
                          <Checkbox value={permission.id}>
                            <Space direction='vertical' size={0}>
                              <Text>{permission.displayName}</Text>
                              <Text type='secondary' style={{ fontSize: 12 }}>{permission.name}</Text>
                            </Space>
                          </Checkbox>
                        </Col>
                      ))}
                    </Row>
                  </Card>
                ))}
              </Space>
            </Checkbox.Group>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Reset password — ${passwordModal.user?.firstname || ''} ${passwordModal.user?.lastname || ''}`}
        open={passwordModal.open}
        onCancel={() => setPasswordModal({ open: false, user: null })}
        onOk={resetPassword}
        confirmLoading={loading}
        destroyOnClose
      >
        <Alert type='warning' showIcon message='Share the temporary password securely. Password values are never written to the audit log.' style={{ marginBottom: 16 }} />
        <Form form={passwordForm} layout='vertical'>
          <Form.Item name='password' label='Temporary password' rules={[{ required: true, min: 10 }]}>
            <Input.Password addonAfter={<Button type='text' size='small' onClick={() => passwordForm.setFieldValue('password', temporaryPassword())}>Generate</Button>} />
          </Form.Item>
          <Form.Item name='forcePasswordChange' label='Require password change' valuePropName='checked'><Switch /></Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default AccessControl
