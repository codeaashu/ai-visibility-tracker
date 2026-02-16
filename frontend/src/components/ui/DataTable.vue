<script setup lang="ts" generic="TData, TValue">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  ExpandedState,
  PaginationState,
  RowSelectionState,
  Updater,
  Row,
} from '@tanstack/vue-table'

import { valueUpdater } from '@/lib/utils'

import { ref, type HTMLAttributes } from 'vue'
import DataTablePagination from '@/components/ui/DataTablePagination.vue'

import {
    FlexRender,
    getCoreRowModel,
    getPaginationRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getExpandedRowModel,
    useVueTable,
} from "@tanstack/vue-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const props = defineProps<{
    columns: ColumnDef<TData, TValue>[]
    data: TData[],
    totalItems: number,
    pagination: PaginationState,
    rowSelection?: RowSelectionState,
    showPagination: boolean,
    showBorder?: boolean,
    onPaginationChange?: (payload: Updater<PaginationState>) => void,
    onRowSelectionChange?: (payload: Updater<RowSelectionState>) => void,
    onRowClick?: (row: Row<TData>) => void,
    rowStyler?: (row: Row<TData>) => HTMLAttributes["style"]
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const expanded = ref<ExpandedState>({})

const table = useVueTable({
    get data() { return props.data },
    get columns() { return props.columns },
    get rowCount() { return props.totalItems },
    get manualPagination() { return true },
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
    onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
    onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
    onRowSelectionChange: props.onRowSelectionChange,
    onExpandedChange: updaterOrValue => valueUpdater(updaterOrValue, expanded),
    onPaginationChange: props.onPaginationChange,
    getRowId: row => (row as any).id,
    state: {
        get sorting() { return sorting.value },
        get columnFilters() { return columnFilters.value },
        get columnVisibility() { return columnVisibility.value },
        get rowSelection() { return props.rowSelection },
        get expanded() { return expanded.value },
        get pagination() { return props.pagination },
    },
})
</script>

<template>
    <div>
        <div :class="{ 'border rounded-md': showBorder || showBorder === undefined }">
            <Table>
                <TableHeader>
                    <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
                        <TableHead v-for="header in headerGroup.headers" :key="header.id">
                            <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header"
                                :props="header.getContext()" />
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <template v-if="table.getRowModel().rows?.length">
                      <template v-for="row in table.getRowModel().rows" :key="row.id">
                        <TableRow :data-state="row.getIsSelected() ? 'selected' : undefined" @click="props.onRowClick ? props.onRowClick(row) : undefined" :style="props.rowStyler ? props.rowStyler(row) : undefined">
                            <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
                            </TableCell>
                        </TableRow>
                        <TableRow v-if="row.getIsExpanded()">
                          <TableCell :colspan="row.getAllCells().length">
                            {{ JSON.stringify(row.original) }}
                          </TableCell>
                        </TableRow>
                      </template>
                    </template>
                    <template v-else>
                        <TableRow>
                            <TableCell :colSpan="columns.length" class="h-24 text-center">
                                No results.
                            </TableCell>
                        </TableRow>
                    </template>
                </TableBody>
            </Table>
        </div>
        <DataTablePagination v-if="props.showPagination" class="mt-4" :table="table" />
    </div>
</template>
