import { Link } from 'react-router-dom'
import {
  InboxOutlined,
  FileTextOutlined,
  PlusCircleOutlined,
  UnorderedListOutlined,
  ImportOutlined,
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

export const storeManagerSiderRoutes = [
  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Purchase Request
    </span>,
    'pr-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/requisitions/create'>Submit Request</Link>,
    'purchase-req-create',
    <FormOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Purchase Indents
    </span>,
    'indents-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/indents'>My Indents</Link>,
    'purchase-indents',
    <UnorderedListOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/indents/create'>Create Indent</Link>,
    'purchase-indents-create',
    <PlusCircleOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Goods Receipt
    </span>,
    'grn-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/grn'>GRN List</Link>,
    'purchase-grn-list',
    <InboxOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <Link to='/purchase/grn/create'>Create GRN</Link>,
    'purchase-grn-create',
    <ImportOutlined style={{ fontSize: '16px' }} />
  ),

  getItemLayout(
    <span style={{ fontWeight: 600, color: '#6C757D', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
      Purchase Orders
    </span>,
    'po-divider',
    null,
    []
  ),

  getItemLayout(
    <Link to='/purchase/po'>View POs</Link>,
    'purchase-po-list',
    <FileTextOutlined style={{ fontSize: '16px' }} />
  )
]
