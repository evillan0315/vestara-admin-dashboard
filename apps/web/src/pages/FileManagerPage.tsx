import { Box, Typography, Button, Paper, styled } from '@mui/material';
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material';
import { useMemo, type ReactElement } from 'react';
import { DataTable } from '../components/data/DataTable';
import { Loading } from '../components/feedback/Loading';
import { useFileManagerPage } from '../features/files/hooks/useFileManagerPage';
import { FileManagerBreadcrumbs } from '../features/files/components/FileManagerBreadcrumbs';
import { FileManagerToolbar } from '../features/files/components/FileManagerToolbar';
import { FileManagerFolderGrid } from '../features/files/components/FileManagerFolderGrid';
import { createFileManagerColumns } from '../features/files/components/FileManagerTableColumns';
import {
  UploadDialog,
  CreateFolderDialog,
  RenameDialog,
  MoveDialog,
  DeleteConfirmDialog,
  BulkDeleteConfirmDialog,
  PreviewDialog,
} from '../features/files/components/FileManagerDialogs';
import type { FileItemDTO } from '../api/files';

const PageContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  gap: 24,
}));

export function FileManagerPage(): ReactElement {
  const ctx = useFileManagerPage();

  const columns = useMemo(
    () =>
      createFileManagerColumns({
        onDownload: ctx.handleDownload,
        onRenameOpen: ctx.handleRenameOpen,
        onMoveSingle: ctx.handleMoveSingle,
        onPreview: ctx.handlePreview,
        onDeleteRequest: (file) => ctx.setDeleteTarget(file),
      }),
    [ctx.handleDownload, ctx.handleRenameOpen, ctx.handleMoveSingle, ctx.handlePreview, ctx.setDeleteTarget],
  );

  return (
    <PageContainer
      onDragOver={ctx.handleDragOver}
      onDragLeave={ctx.handleDragLeave}
      onDrop={ctx.handleDrop}
    >
      <Box>
        <Typography variant="h4" fontWeight={700}>
          File Manager
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
          Upload, organize, and manage your files and folders.
        </Typography>
      </Box>

      <FileManagerBreadcrumbs
        folderStack={ctx.folderStack}
        viewMode={ctx.viewMode}
        onNavigate={ctx.navigateToBreadcrumb}
        onToggleView={() => ctx.setViewMode(ctx.viewMode === 'list' ? 'grid' : 'list')}
      />

      <FileManagerToolbar
        selectedCount={ctx.selectedIds.length}
        search={ctx.search}
        onSearchChange={(v) => ctx.setSearch(v)}
        onSearchClear={() => ctx.setSearch('')}
        onUploadOpen={ctx.handleUploadOpen}
        onCreateFolderOpen={ctx.handleCreateFolderOpen}
        onMoveOpen={ctx.handleMoveOpen}
        onBulkDeleteOpen={() => ctx.setBulkDeleteOpen(true)}
        selectedIds={ctx.selectedIds}
      />

      {ctx.isLoading && <Loading variant="inline" message="Loading files..." />}

      {ctx.isError && !ctx.isLoading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error" gutterBottom>
            {ctx.error instanceof Error ? ctx.error.message : 'Failed to load files'}
          </Typography>
          <Button variant="outlined" onClick={() => ctx.refetch()}>Retry</Button>
        </Paper>
      )}

      {!ctx.isLoading && !ctx.isError && (
        <>
          <FileManagerFolderGrid
            folders={ctx.sortedFolders}
            onNavigate={ctx.navigateToFolder}
            onRename={ctx.handleRenameOpen}
            onDeleteRequest={ctx.setDeleteTarget}
          />

          <DataTable<FileItemDTO>
            columns={columns}
            rows={ctx.filteredFiles}
            keyExtractor={(row) => row.id}
            loading={false}
            sortState={ctx.sort}
            onSortChange={ctx.setSort}
            selectable
            selectedIds={ctx.selectedIds}
            onSelectionChange={ctx.setSelectedIds}
            searchable={false}
            title={ctx.filteredFiles.length > 0 ? `Files (${ctx.filteredFiles.length})` : 'Files'}
            emptyIcon={<CloudUploadIcon sx={{ fontSize: 48 }} />}
            emptyTitle={ctx.search ? 'No files match your search' : 'No files in this folder'}
            emptyDescription={ctx.search ? 'Try a different search term.' : 'Upload files or create a folder to get started.'}
          />
        </>
      )}

      <UploadDialog
        open={ctx.uploadDialogOpen}
        uploadFiles={ctx.uploadFiles}
        uploadProgress={ctx.uploadProgress}
        isDragActive={ctx.isDragActive}
        uploading={ctx.uploadMutation.isPending}
        onClose={ctx.handleUploadClose}
        onFilesSelected={ctx.handleFilesSelected}
        onRemoveFile={ctx.handleRemoveUploadFile}
        onSubmit={ctx.handleUploadSubmit}
        onDragOver={ctx.handleDragOver}
        onDragLeave={ctx.handleDragLeave}
        onDrop={ctx.handleDrop}
      />

      <CreateFolderDialog
        open={ctx.createFolderOpen}
        folderName={ctx.newFolderName}
        loading={ctx.createFolderMutation.isPending}
        onClose={() => ctx.setCreateFolderOpen(false)}
        onNameChange={ctx.setNewFolderName}
        onSubmit={ctx.handleCreateFolderSubmit}
      />

      <RenameDialog
        open={!!ctx.renameTarget}
        value={ctx.renameValue}
        loading={ctx.updateFileMutation.isPending}
        onClose={() => ctx.setRenameTarget(null)}
        onChange={ctx.setRenameValue}
        onSubmit={ctx.handleRenameSubmit}
      />

      <MoveDialog
        open={ctx.moveDialogOpen}
        targetCount={ctx.moveTargetIds.length}
        availableFolders={ctx.availableFolders}
        selectedFolderId={ctx.selectedMoveFolderId}
        loading={ctx.loadingFolders}
        moveTargetIds={ctx.moveTargetIds}
        onClose={() => ctx.setMoveDialogOpen(false)}
        onSelect={ctx.setSelectedMoveFolderId}
        onSubmit={ctx.handleMoveSubmit}
      />

      <DeleteConfirmDialog
        open={!!ctx.deleteTarget}
        itemName={ctx.deleteTarget?.name ?? ''}
        isFolder={'mimeType' in (ctx.deleteTarget ?? {}) && (ctx.deleteTarget as FileItemDTO).mimeType === 'folder'}
        loading={ctx.deleteFileMutation.isPending}
        onConfirm={ctx.handleDelete}
        onClose={() => ctx.setDeleteTarget(null)}
      />

      <BulkDeleteConfirmDialog
        open={ctx.bulkDeleteOpen}
        count={ctx.selectedIds.length}
        loading={ctx.bulkDeleteMutation.isPending}
        onConfirm={ctx.handleBulkDelete}
        onClose={() => ctx.setBulkDeleteOpen(false)}
      />

      <PreviewDialog
        file={ctx.previewFile}
        onClose={() => ctx.setPreviewFile(null)}
        onDownload={ctx.handleDownload}
      />
    </PageContainer>
  );
}

export default FileManagerPage;
