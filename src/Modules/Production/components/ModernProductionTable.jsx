import React from 'react'
import { Button } from 'antd'
import ModernProductionCard from './ModernProductionCard'

// Glassmorphic Card Component
const GlassCard = ({ children, className = '' }) => (
  <div
    className={`
      relative rounded-2xl backdrop-blur-xl bg-white/70 dark:bg-slate-900/70
      border border-white/30 dark:border-slate-700/50
      shadow-2xl shadow-black/10
      ${className}
    `}
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 via-white/20 to-transparent dark:from-white/10 dark:via-white/5 pointer-events-none" />
    <div className="relative">{children}</div>
  </div>
)

// Main Modern Production Table Component
const ModernProductionTable = ({
  productionPlans,
  loading,
  currentPage,
  pageSize,
  totalPlansCount,
  handlePageChange,
  handleView,
  handleEdit,
  handleDelete,
  handleCreateJobCard,
  handleAssignPreset,
  handleMoveToNextStep,
  canCreateJobCard,
  canMoveToNextStep,
  getCreateJobCardTooltip,
  getMoveTooltip,
  getActionMenu,
  expandedRowKeys,
  handleExpand,
  expandedRowRender
}) => {
  const totalPages = Math.ceil(totalPlansCount / pageSize)

  return (
    <div className="space-y-6">
      {/* Production Plans Grid */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-6 text-lg text-gray-600 dark:text-gray-400 font-medium">Loading production plans...</p>
          </div>
        ) : productionPlans.length === 0 ? (
          <GlassCard className="p-16 text-center">
            <div className="text-gray-300 dark:text-gray-600 text-8xl mb-6">📋</div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              No Production Plans Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Create your first production plan to get started with manufacturing
            </p>
          </GlassCard>
        ) : (
          productionPlans.map((record) => (
            <ModernProductionCard
              key={record.id}
              record={record}
              handleView={handleView}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleCreateJobCard={handleCreateJobCard}
              handleAssignPreset={handleAssignPreset}
              handleMoveToNextStep={handleMoveToNextStep}
              canCreateJobCard={canCreateJobCard}
              canMoveToNextStep={canMoveToNextStep}
              getCreateJobCardTooltip={getCreateJobCardTooltip}
              getMoveTooltip={getMoveTooltip}
              getActionMenu={getActionMenu}
              expandedRowKeys={expandedRowKeys}
              handleExpand={handleExpand}
              expandedRowRender={expandedRowRender}
            />
          ))
        )}
      </div>

      {/* Enhanced Pagination */}
      {!loading && productionPlans.length > 0 && (
        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Results Info */}
            <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Showing <span className="font-bold text-gray-900 dark:text-white">{((currentPage - 1) * pageSize) + 1}</span> to{' '}
              <span className="font-bold text-gray-900 dark:text-white">{Math.min(currentPage * pageSize, totalPlansCount)}</span> of{' '}
              <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalPlansCount}</span> plans
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
              {/* Previous Button */}
              <Button
                onClick={() => handlePageChange(currentPage - 1, pageSize)}
                disabled={currentPage === 1}
                size="large"
                className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg px-6"
              >
                ← Previous
              </Button>

              {/* Page Numbers */}
              <div className="hidden sm:flex items-center gap-2">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum
                  if (totalPages <= 7) {
                    pageNum = i + 1
                  } else if (currentPage <= 4) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 3) {
                    pageNum = totalPages - 6 + i
                  } else {
                    pageNum = currentPage - 3 + i
                  }

                  if (pageNum < 1 || pageNum > totalPages) return null

                  return (
                    <Button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum, pageSize)}
                      size="large"
                      className={
                        pageNum === currentPage
                          ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30 font-bold min-w-[44px]'
                          : 'backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 font-semibold shadow-lg min-w-[44px]'
                      }
                    >
                      {pageNum}
                    </Button>
                  )
                })}
              </div>

              {/* Current Page (Mobile) */}
              <div className="sm:hidden">
                <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold shadow-lg">
                  {currentPage} / {totalPages}
                </div>
              </div>

              {/* Next Button */}
              <Button
                onClick={() => handlePageChange(currentPage + 1, pageSize)}
                disabled={currentPage >= totalPages}
                size="large"
                className="backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg px-6"
              >
                Next →
              </Button>
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Per page:</span>
              <div className="flex gap-2">
                {[10, 25, 50, 100].map(size => (
                  <Button
                    key={size}
                    onClick={() => handlePageChange(1, size)}
                    size="middle"
                    className={
                      size === pageSize
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/30 font-bold'
                        : 'backdrop-blur-xl bg-white/80 dark:bg-slate-800/80 border-white/30 hover:bg-white dark:hover:bg-slate-700 font-semibold'
                    }
                  >
                    {size}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      )}
    </div>
  )
}

export default ModernProductionTable
