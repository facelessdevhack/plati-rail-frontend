/**
 * Stock Upload Page
 *
 * Main page for uploading Excel stock files, viewing matched/unmatched entries,
 * mapping finishes and specs, and updating stock in the database.
 */

import React, { useState, useCallback } from 'react';
import {
  Card,
  Steps,
  Button,
  message,
  Result,
  Space,
  Statistic,
  Row,
  Col,
  Alert
} from 'antd';
import {
  UploadOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  SyncOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import ExcelUploader from './components/ExcelUploader';
import MatchResultsTabs from './components/MatchResultsTabs';
import UpdatePreview from './components/UpdatePreview';
import UpdateSummary from './components/UpdateSummary';
import { parseExcelFile, previewWithMappings, executeUpdates, getAllFinishes, getAllSpecs } from './stockUploadApi';

const { Step } = Steps;

const StockUploadPage = () => {
  // Step management
  const [currentStep, setCurrentStep] = useState(0);

  // Data state
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parseResults, setParseResults] = useState(null);
  // Custom mappings structure: { finish: {}, width: {}, pcd: {}, holes: {} }
  const [customMappings, setCustomMappings] = useState({
    finish: {},
    width: {},
    pcd: {},
    holes: {}
  });
  const [dbFinishes, setDbFinishes] = useState([]);
  const [dbSpecs, setDbSpecs] = useState({ widths: [], pcds: [], holes: [] });
  const [updateResults, setUpdateResults] = useState(null);
  // Manual matches: { entryId: { productId, productName, inHouseStock, excelQty } }
  const [manualMatches, setManualMatches] = useState({});

  // Loading states
  const [uploading, setUploading] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [executing, setExecuting] = useState(false);

  // Load finishes and specs for mapping
  const loadMasterData = useCallback(async () => {
    const [finishResult, specsResult] = await Promise.all([
      getAllFinishes(),
      getAllSpecs()
    ]);

    if (finishResult.success) {
      setDbFinishes(finishResult.data);
    }
    if (specsResult.success) {
      setDbSpecs(specsResult.data);
    }
  }, []);

  // Handle file upload
  const handleUpload = async (file) => {
    setUploading(true);
    setUploadedFile(file);

    try {
      // Load master data (finishes and specs) first
      await loadMasterData();

      // Parse the Excel file
      const result = await parseExcelFile(file, customMappings);

      if (result.success) {
        setParseResults(result.data);
        setCurrentStep(1);
        message.success(`Successfully parsed ${result.data.totalExcelEntries} entries`);
      } else {
        message.error(result.message || 'Failed to parse Excel file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      message.error('An error occurred while uploading the file');
    } finally {
      setUploading(false);
    }

    return false; // Prevent default upload behavior
  };

  // Handle finish mapping change
  const handleMappingChange = (type, excelValue, dbValue) => {
    setCustomMappings(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [excelValue]: dbValue
      }
    }));
  };

  // Handle spec mapping change (width, pcd, holes)
  const handleSpecMappingChange = (specType, excelValue, dbValue) => {
    setCustomMappings(prev => ({
      ...prev,
      [specType]: {
        ...prev[specType],
        [excelValue]: dbValue
      }
    }));
  };

  // Handle manual match change
  const handleManualMatchChange = (entryId, alloyId, matchData) => {
    setManualMatches(prev => {
      if (alloyId === null) {
        // Remove the match
        const { [entryId]: removed, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [entryId]: matchData
      };
    });
  };

  // Check if any mappings have been made
  const hasMappings = () => {
    return Object.values(customMappings).some(
      mappingObj => Object.keys(mappingObj).length > 0
    );
  };

  // Recalculate with new mappings
  const handleRecalculate = async () => {
    if (!uploadedFile) {
      message.error('No file uploaded');
      return;
    }

    setRecalculating(true);

    try {
      const result = await previewWithMappings(uploadedFile, customMappings);

      if (result.success) {
        setParseResults(result.data);
        message.success('Recalculated with new mappings');
      } else {
        message.error(result.message || 'Failed to recalculate');
      }
    } catch (error) {
      console.error('Recalculate error:', error);
      message.error('An error occurred while recalculating');
    } finally {
      setRecalculating(false);
    }
  };

  // Move to preview step
  const handleGoToPreview = () => {
    setCurrentStep(2);
  };

  // Get all updates including manual matches
  const getAllUpdates = () => {
    const regularUpdates = parseResults?.updates || [];

    // Convert manual matches to update format
    const manualUpdates = Object.values(manualMatches).map(match => ({
      productId: match.productId,
      productName: match.productName,
      oldStock: match.inHouseStock,
      newStock: match.inHouseStock + match.excelQty, // Add Excel qty to existing stock
      difference: match.excelQty,
      isManualMatch: true
    }));

    // Merge: if same productId exists in both, combine the quantities
    const updateMap = new Map();

    regularUpdates.forEach(update => {
      updateMap.set(update.productId, { ...update });
    });

    manualUpdates.forEach(update => {
      if (updateMap.has(update.productId)) {
        // Add to existing update
        const existing = updateMap.get(update.productId);
        existing.newStock += update.difference;
        existing.difference += update.difference;
      } else {
        updateMap.set(update.productId, update);
      }
    });

    return Array.from(updateMap.values());
  };

  // Execute updates
  const handleExecute = async () => {
    const allUpdates = getAllUpdates();

    if (allUpdates.length === 0) {
      message.warning('No updates to apply');
      return;
    }

    setExecuting(true);

    try {
      const result = await executeUpdates(allUpdates, {
        dryRun: false
      });

      if (result.success) {
        setUpdateResults(result.data);
        setCurrentStep(3);
        message.success(result.message || 'Updates applied successfully');
      } else {
        message.error(result.message || 'Failed to apply updates');
      }
    } catch (error) {
      console.error('Execute error:', error);
      message.error('An error occurred while applying updates');
    } finally {
      setExecuting(false);
    }
  };

  // Reset everything
  const handleReset = () => {
    setCurrentStep(0);
    setUploadedFile(null);
    setParseResults(null);
    setCustomMappings({
      finish: {},
      width: {},
      pcd: {},
      holes: {}
    });
    setManualMatches({});
    setUpdateResults(null);
  };

  // Navigate steps
  const goBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <ExcelUploader
            onUpload={handleUpload}
            uploading={uploading}
          />
        );

      case 1:
        return (
          <div>
            {/* Summary Stats */}
            <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
              <Col xs={12} sm={Object.keys(manualMatches).length > 0 ? 4 : 6}>
                <Card size="small">
                  <Statistic
                    title="Total Entries"
                    value={parseResults?.totalExcelEntries || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={Object.keys(manualMatches).length > 0 ? 4 : 6}>
                <Card size="small">
                  <Statistic
                    title="Matched"
                    value={parseResults?.matchedCount || 0}
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              {Object.keys(manualMatches).length > 0 && (
                <Col xs={12} sm={4}>
                  <Card size="small">
                    <Statistic
                      title="Manual Matches"
                      value={Object.keys(manualMatches).length}
                      valueStyle={{ color: '#722ed1' }}
                    />
                  </Card>
                </Col>
              )}
              <Col xs={12} sm={Object.keys(manualMatches).length > 0 ? 4 : 6}>
                <Card size="small">
                  <Statistic
                    title="Missing Models"
                    value={parseResults?.missingModelsCount || 0}
                    valueStyle={{ color: '#fa8c16' }}
                  />
                </Card>
              </Col>
              <Col xs={12} sm={Object.keys(manualMatches).length > 0 ? 4 : 6}>
                <Card size="small">
                  <Statistic
                    title="Not Matched"
                    value={parseResults?.notMatchedCount || 0}
                    valueStyle={{ color: '#ff4d4f' }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Missing finishes or specs alert */}
            {(parseResults?.missingFinishes?.length > 0 ||
              parseResults?.missingWidths?.length > 0 ||
              parseResults?.missingPcds?.length > 0 ||
              parseResults?.missingHoles?.length > 0) && (
              <Alert
                type="warning"
                message="Missing Specs Detected"
                description={
                  <>
                    {parseResults.missingFinishes?.length > 0 && (
                      <div>{parseResults.missingFinishes.length} finish(es) could not be matched.</div>
                    )}
                    {parseResults.missingWidths?.length > 0 && (
                      <div>{parseResults.missingWidths.length} width(s) could not be matched.</div>
                    )}
                    {parseResults.missingPcds?.length > 0 && (
                      <div>{parseResults.missingPcds.length} PCD(s) could not be matched.</div>
                    )}
                    {parseResults.missingHoles?.length > 0 && (
                      <div>{parseResults.missingHoles.length} holes value(s) could not be matched.</div>
                    )}
                    <div style={{ marginTop: 8 }}>Use the mapping tabs below to map them to database values.</div>
                  </>
                }
                style={{ marginBottom: 16 }}
                showIcon
              />
            )}

            {/* Match results tabs */}
            <MatchResultsTabs
              matched={parseResults?.matched || []}
              notMatched={parseResults?.notMatched || []}
              missingModels={parseResults?.missingModels || []}
              missingFinishes={parseResults?.missingFinishes || []}
              missingWidths={parseResults?.missingWidths || []}
              missingPcds={parseResults?.missingPcds || []}
              missingHoles={parseResults?.missingHoles || []}
              missingInches={parseResults?.missingInches || []}
              updates={parseResults?.updates || []}
              noChange={parseResults?.noChange || []}
              dbFinishes={dbFinishes}
              dbSpecs={dbSpecs}
              customMappings={customMappings}
              onMappingChange={handleMappingChange}
              onSpecMappingChange={handleSpecMappingChange}
              manualMatches={manualMatches}
              onManualMatchChange={handleManualMatchChange}
            />

            {/* Actions */}
            <div style={{ marginTop: 24, display: 'flex', gap: 16, justifyContent: 'space-between' }}>
              <Button icon={<ArrowLeftOutlined />} onClick={goBack}>
                Back to Upload
              </Button>
              <Space>
                {hasMappings() && (
                  <Button
                    icon={<SyncOutlined />}
                    onClick={handleRecalculate}
                    loading={recalculating}
                  >
                    Recalculate with Mappings
                  </Button>
                )}
                <Button
                  type="primary"
                  icon={<EyeOutlined />}
                  onClick={handleGoToPreview}
                  disabled={!parseResults?.updates?.length && Object.keys(manualMatches).length === 0}
                >
                  Preview Updates ({(parseResults?.updatesCount || 0) + Object.keys(manualMatches).length})
                </Button>
              </Space>
            </div>
          </div>
        );

      case 2:
        return (
          <UpdatePreview
            updates={getAllUpdates()}
            noChange={parseResults?.noChange || []}
            onBack={() => setCurrentStep(1)}
            onExecute={handleExecute}
            executing={executing}
            manualMatchCount={Object.keys(manualMatches).length}
          />
        );

      case 3:
        return (
          <UpdateSummary
            results={updateResults}
            onReset={handleReset}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Card>
        <Steps current={currentStep} style={{ marginBottom: 32 }}>
          <Step
            title="Upload"
            icon={<UploadOutlined />}
            description="Upload Excel file"
          />
          <Step
            title="Review"
            icon={<EyeOutlined />}
            description="Review & map entries"
          />
          <Step
            title="Preview"
            icon={<CheckCircleOutlined />}
            description="Preview changes"
          />
          <Step
            title="Complete"
            icon={<SyncOutlined />}
            description="Update database"
          />
        </Steps>

        {renderStepContent()}
      </Card>
    </div>
  );
};

export default StockUploadPage;
