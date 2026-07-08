import React, { useState, useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Switch } from 'antd'
import {
  ToolOutlined,
  ArrowRightOutlined,
  FireOutlined
} from '@ant-design/icons'
import { client } from '../../Utils/axiosClient'

const { Option } = Select

// ─── plati design tokens ───
const FONT = "'Inter', sans-serif"
const INK = '#1a1a1a'
const INK60 = 'rgba(26,26,26,0.6)'
const BORDER = '#e5e5e5'
const PURPLE = '#7c3aed' // rework identity color (matches listing)
const ORANGE = '#f26c2d' // brand primary

const Pill = ({ bg, border, dot, children }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: 999,
      fontSize: 12,
      fontFamily: FONT,
      color: INK,
      background: bg,
      border: `1px solid ${border}`,
      whiteSpace: 'nowrap'
    }}
  >
    {dot && (
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: dot,
          flexShrink: 0
        }}
      />
    )}
    {children}
  </span>
)

const SectionLabel = ({ children }) => (
  <div
    style={{
      fontFamily: FONT,
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: INK60,
      marginBottom: 8
    }}
  >
    {children}
  </div>
)

const CreateReworkPlanModal = ({ visible, onCancel, onSuccess, rejectionRecord }) => {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [availableTargetFinishes, setAvailableTargetFinishes] = useState([])
  const [loadingFinishes, setLoadingFinishes] = useState(false)

  // reactive form values → the summary strip updates live
  const watchedTarget = Form.useWatch('convertToAlloyId', form)
  const watchedQty = Form.useWatch('quantity', form)
  const watchedUrgent = Form.useWatch('urgent', form)

  useEffect(() => {
    if (visible && rejectionRecord) {
      form.resetFields()
      form.setFieldsValue({
        quantity: rejectionRecord.rejectedQuantity,
        urgent: true,
        convertToAlloyId: rejectionRecord.originalConvertToAlloyId
      })
      fetchAvailableTargetFinishes()
    }
  }, [visible, rejectionRecord])

  const fetchAvailableTargetFinishes = async () => {
    if (!rejectionRecord?.alloyId) return

    setLoadingFinishes(true)
    try {
      // Alloys matching the EXACT same specs (model/inches/pcd/holes/width)
      const response = await client.get('/alloys/stock/management', {
        params: {
          page: 1,
          limit: 1000,
          modelName: rejectionRecord.modelName,
          inchesId: rejectionRecord.inchesId,
          pcdId: rejectionRecord.pcdId,
          holesId: rejectionRecord.holesId,
          widthId: rejectionRecord.widthId
        }
      })

      if (response.data?.data) {
        const stockData = response.data.data

        // The most common rework is BACK TO THE SAME target — options use the
        // alloy id as value (what the API expects) and the original target is
        // included and listed first.
        const options = stockData
          .map(alloy => ({
            value: alloy.id,
            label: alloy.finish,
            stock: alloy.inHouseStock || 0,
            finishId: alloy.finishId,
            productName: alloy.productName,
            isOriginal: alloy.id === rejectionRecord.originalConvertToAlloyId
          }))
          .filter(
            (opt, index, arr) =>
              arr.findIndex(o => o.value === opt.value) === index
          )
          .sort((a, b) =>
            a.isOriginal ? -1 : b.isOriginal ? 1 : a.label.localeCompare(b.label)
          )

        setAvailableTargetFinishes(options)
      }
    } catch (error) {
      console.error('Error fetching target finishes:', error)
    } finally {
      setLoadingFinishes(false)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const response = await client.post(
        `/production/rejected-stock/${rejectionRecord.rejectionId}/process`,
        {
          action: 'create_rework_plan',
          quantity: values.quantity,
          convertToAlloyId: values.convertToAlloyId, // option value = alloy id
          urgent: values.urgent
        }
      )

      if (response.data.success) {
        onSuccess(response.data.message, response.data.planId)
        form.resetFields()
        onCancel()
      }
    } catch (error) {
      console.error('Error creating rework plan:', error)
      // Error message will be shown by parent component
    } finally {
      setLoading(false)
    }
  }

  if (!rejectionRecord) return null

  const selectedTarget = availableTargetFinishes.find(
    f => f.value === watchedTarget
  )
  const maxQty = rejectionRecord.rejectedQuantity
  const remainder = Math.max(0, maxQty - (watchedQty || 0))

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      width={640}
      title={null}
      footer={null}
      styles={{ content: { borderRadius: 20, padding: 0, overflow: 'hidden' } }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '20px 28px 16px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#f3e8ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: PURPLE,
            fontSize: 18,
            flexShrink: 0
          }}
        >
          <ToolOutlined />
        </span>
        <div>
          <div
            style={{
              fontFamily: FONT,
              fontSize: 18,
              fontWeight: 600,
              color: INK,
              lineHeight: '24px'
            }}
          >
            Create Rework Plan
          </div>
          <div style={{ fontFamily: FONT, fontSize: 13, color: INK60 }}>
            Send rejected units back through production
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 28px' }}>
        {/* ── Source context ── */}
        <SectionLabel>Rejected stock</SectionLabel>
        <div
          style={{
            background: '#fafafa',
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: '14px 16px',
            marginBottom: 20
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 14,
                  fontWeight: 600,
                  color: INK,
                  lineHeight: '20px'
                }}
              >
                {rejectionRecord.alloyName}
              </div>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 13,
                  color: INK60,
                  marginBottom: 8
                }}
              >
                Current finish: {rejectionRecord.finishName}
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Pill bg='#ecfeff' border='rgba(8,145,178,0.2)' dot='#0891b2'>
                  Plan #{rejectionRecord.planId}
                </Pill>
                <Pill bg='#f3f3f5' border={BORDER}>
                  Job Card #{rejectionRecord.jobCardId}
                </Pill>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div
                style={{
                  fontFamily: FONT,
                  fontSize: 28,
                  fontWeight: 700,
                  color: '#dc2626',
                  lineHeight: '32px'
                }}
              >
                {maxQty}
              </div>
              <div style={{ fontFamily: FONT, fontSize: 12, color: INK60 }}>
                rejected unit{maxQty !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
          {rejectionRecord.rejectionReason && (
            <div
              style={{
                marginTop: 10,
                paddingTop: 10,
                borderTop: `1px dashed ${BORDER}`,
                fontFamily: FONT,
                fontSize: 13,
                color: INK60,
                fontStyle: 'italic'
              }}
            >
              “{rejectionRecord.rejectionReason}”
            </div>
          )}
        </div>

        {/* ── Configuration ── */}
        <SectionLabel>Rework configuration</SectionLabel>
        <Form
          form={form}
          layout='vertical'
          initialValues={{ quantity: maxQty, urgent: true }}
        >
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item
              label={
                <span style={{ fontFamily: FONT, fontSize: 13, color: INK }}>
                  Quantity to rework
                </span>
              }
              name='quantity'
              style={{ marginBottom: 16, width: 180 }}
              rules={[
                { required: true, message: 'Enter a quantity' },
                {
                  type: 'number',
                  min: 1,
                  max: maxQty,
                  message: `Between 1 and ${maxQty}`
                }
              ]}
            >
              <InputNumber
                min={1}
                max={maxQty}
                style={{ width: '100%', borderRadius: 10 }}
                size='large'
                addonAfter={`of ${maxQty}`}
              />
            </Form.Item>

            <Form.Item
              label={
                <span style={{ fontFamily: FONT, fontSize: 13, color: INK }}>
                  Priority
                </span>
              }
              name='urgent'
              valuePropName='checked'
              style={{ marginBottom: 16 }}
            >
              <Switch
                checkedChildren={
                  <span>
                    <FireOutlined /> Urgent
                  </span>
                }
                unCheckedChildren='Normal'
              />
            </Form.Item>
          </div>
          {remainder > 0 && (
            <div
              style={{
                fontFamily: FONT,
                fontSize: 12,
                color: '#b45309',
                marginTop: -8,
                marginBottom: 12
              }}
            >
              {remainder} unit{remainder !== 1 ? 's' : ''} will stay on the
              rejection for a later decision.
            </div>
          )}

          <Form.Item
            label={
              <span style={{ fontFamily: FONT, fontSize: 13, color: INK }}>
                Rework into (target finish)
              </span>
            }
            name='convertToAlloyId'
            style={{ marginBottom: 4 }}
            rules={[{ required: true, message: 'Select the target finish' }]}
          >
            <Select
              placeholder='Search or select target finish'
              loading={loadingFinishes}
              showSearch
              // children here are rich JSX — antd can't text-match those, so
              // 'optionFilterProp=children' silently filtered everything out.
              // Filter against a plain-text label instead.
              filterOption={(input, option) =>
                (option?.label || '')
                  .toLowerCase()
                  .includes(input.toLowerCase())
              }
              size='large'
              style={{ width: '100%' }}
              notFoundContent={
                loadingFinishes ? 'Loading finishes…' : 'No matching finishes'
              }
            >
              {availableTargetFinishes.map(finish => (
                <Option
                  key={finish.value}
                  value={finish.value}
                  label={`${finish.label} ${finish.productName}`}
                >
                  <span style={{ fontFamily: FONT }}>
                    <strong>{finish.label}</strong>
                    <span style={{ color: INK60 }}> — {finish.productName}</span>
                    {finish.isOriginal && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          color: '#0e7490',
                          background: '#ecfeff',
                          border: '1px solid rgba(8,145,178,0.2)',
                          borderRadius: 999,
                          padding: '1px 8px'
                        }}
                      >
                        original target
                      </span>
                    )}
                    <span
                      style={{
                        float: 'right',
                        fontSize: 12,
                        color: finish.stock > 0 ? '#15803d' : '#dc2626'
                      }}
                    >
                      stock {finish.stock}
                    </span>
                  </span>
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>

        {/* ── Live summary strip ── */}
        <div
          style={{
            marginTop: 16,
            background: '#f5f3ff',
            border: '1px solid rgba(124,58,237,0.2)',
            borderRadius: 14,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontFamily: FONT
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: INK,
              whiteSpace: 'nowrap'
            }}
          >
            {watchedQty || 0} unit{(watchedQty || 0) !== 1 ? 's' : ''}
          </span>
          <Pill bg='white' border={BORDER}>
            {rejectionRecord.finishName}
          </Pill>
          <ArrowRightOutlined style={{ color: PURPLE }} />
          <Pill
            bg='white'
            border={selectedTarget ? 'rgba(124,58,237,0.35)' : BORDER}
          >
            {selectedTarget ? selectedTarget.label : 'select target…'}
          </Pill>
          {watchedUrgent && (
            <Pill bg='#fef2f2' border='rgba(229,62,62,0.2)' dot='#e53e3e'>
              Urgent
            </Pill>
          )}
        </div>

        {/* ── What happens next ── */}
        <div
          style={{
            marginTop: 16,
            fontFamily: FONT,
            fontSize: 12.5,
            color: INK60,
            lineHeight: '19px'
          }}
        >
          <div>
            • A rework plan linked to Plan #{rejectionRecord.planId} is created
            — it inherits the original plan's production route (steps &
            preset); just create a job card to start.
          </div>
          <div>
            • No warehouse stock is reserved: the rejected wheels are already
            at the plant.
          </div>
          <div>
            • If these were the parent plan's last open units, it completes
            automatically.
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        style={{
          padding: '14px 28px',
          borderTop: `1px solid ${BORDER}`,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 10
        }}
      >
        <button
          onClick={onCancel}
          style={{
            fontFamily: FONT,
            fontSize: 14,
            height: 40,
            padding: '0 18px',
            borderRadius: 999,
            border: `1px solid #a0a0a8`,
            background: 'white',
            color: INK,
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 500,
            height: 40,
            padding: '0 20px',
            borderRadius: 999,
            border: 'none',
            background: ORANGE,
            color: 'white',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.6 : 1,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <ToolOutlined />
          {loading ? 'Creating…' : 'Create Rework Plan'}
        </button>
      </div>
    </Modal>
  )
}

export default CreateReworkPlanModal
