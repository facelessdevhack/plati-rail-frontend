import { Link } from 'react-router-dom'
import {
  AuditOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  TagsOutlined,
  FileTextOutlined,
  FormOutlined
} from '@ant-design/icons'

function getItemLayout(label, key, icon, children) {
  return {
    key,
    icon,
    children,
    label,
    style: icon === null ? {
      color: '#6C757D',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      margin: '16px 0 8px 0',
      cursor: 'default',
      pointerEvents: 'none',
      padding: '0 12px'
    } : {
      margin: '2px 0',
      borderRadius: '8px',
      overflow: 'hidden'
    }
  }
}

export const purchaseManagerSiderRoutes = [
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Requisitions
    </span>,
    'req-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/requisitions/create'>Submit Request</Link>,
    'purchase-req-create',
    <FormOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/requisitions'>Purchase Requisitions</Link>,
    'purchase-requisitions',
    <AuditOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Indents & Orders
    </span>,
    'indent-order-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/indents'>Indents</Link>,
    'purchase-indents',
    <UnorderedListOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/po'>Purchase Orders</Link>,
    'purchase-po-list',
    <FileTextOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/grn'>GRN List</Link>,
    'purchase-grn-list',
    <AuditOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Master Data
    </span>,
    'master-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/items'>Items Master</Link>,
    'purchase-items',
    <AppstoreOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/item-categories'>Item Categories</Link>,
    'purchase-item-categories',
    <TagsOutlined style={{ fontSize: '16px' }} />
  )
]
