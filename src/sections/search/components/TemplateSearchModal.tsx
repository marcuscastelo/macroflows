import { createEffect, Suspense } from 'solid-js'

import {
  currentDayDiet,
  targetDay,
} from '~/modules/diet/day-diet/application/usecases/dayState'
import { type MacroNutrientsRecord } from '~/modules/diet/macro-nutrients/domain/macroNutrients'
import { getMacroTargetForDay } from '~/modules/diet/macro-target/application/macroTarget'
import { getRecipePreparedQuantity } from '~/modules/diet/recipe/domain/recipeOperations'
import { createUnifiedItemFromTemplate } from '~/modules/diet/template/application/createGroupFromTemplate'
import {
  DEFAULT_QUANTITY,
  templateToUnifiedItem,
} from '~/modules/diet/template/application/templateToItem'
import { type Template } from '~/modules/diet/template/domain/template'
import { isTemplateRecipe } from '~/modules/diet/template/domain/template'
import { type TemplateItem } from '~/modules/diet/template-item/domain/templateItem'
import {
  isFoodItem,
  isRecipeItem,
} from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import { type UnifiedItem } from '~/modules/diet/unified-item/schema/unifiedItemSchema'
import {
  fetchRecentFoodByUserTypeAndReferenceId,
  insertRecentFood,
  updateRecentFood,
} from '~/modules/recent-food/application/usecases/recentFoodCrud'
import { createNewRecentFood } from '~/modules/recent-food/domain/recentFood'
import {
  debouncedSearch,
  refetchTemplates,
  setTemplateSearchTab,
  templates,
  templateSearchTab,
} from '~/modules/template-search/application/usecases/templateSearchState'
import { showSuccess } from '~/modules/toast/application/toastManager'
import { showError } from '~/modules/toast/application/toastManager'
import { currentUserId } from '~/modules/user/application/user'
import { EANButton } from '~/sections/common/components/EANButton'
import { PageLoading } from '~/sections/common/components/PageLoading'
import { EANInsertModal } from '~/sections/ean/components/EANInsertModal'
import { TemplateSearchBar } from '~/sections/search/components/TemplateSearchBar'
import { TemplateSearchResults } from '~/sections/search/components/TemplateSearchResults'
import {
  availableTabs,
  TemplateSearchTabs,
} from '~/sections/search/components/TemplateSearchTabs'
import { formatError } from '~/shared/formatError'
import {
  closeModal,
  openConfirmModal,
  openContentModal,
} from '~/shared/modal/helpers/modalHelpers'
import { openUnifiedItemEditModal } from '~/shared/modal/helpers/specializedModalHelpers'
import { stringToDate } from '~/shared/utils/date/dateUtils'
import { logging } from '~/shared/utils/logging'
import { isOverflow } from '~/shared/utils/macroOverflow'

const TEMPLATE_SEARCH_DEFAULT_TAB = availableTabs.Todos.id

export type TemplateSearchModalProps = {
  targetName: string
  onNewUnifiedItem?: (
    item: UnifiedItem,
    originalAddedItem: TemplateItem,
  ) => void
  onFinish?: () => void
  onClose?: () => void
}

export function TemplateSearchModal(props: TemplateSearchModalProps) {
  const handleTemplateSelected = (template: Template) => {
    const initialQuantity = isTemplateRecipe(template)
      ? getRecipePreparedQuantity(template)
      : DEFAULT_QUANTITY

    const controller = openUnifiedItemEditModal({
      targetMealName: props.targetName,
      item: () => templateToUnifiedItem(template, initialQuantity),
      macroOverflow: () => ({ enable: true }),
      title: 'Edit Item',
      targetName: props.targetName,
      onApply: (templateItem: TemplateItem) => {
        const { unifiedItem } = createUnifiedItemFromTemplate(
          template,
          templateItem,
        )

        handleNewUnifiedItem(unifiedItem, templateItem, () =>
          controller.close(),
        ).catch((err) => {
          logging.error('TemplateSearchModal handleNewUnifiedItem error:', err)
          showError(err, {}, `Erro ao adicionar item: ${formatError(err)}`)
        })
      },
      onClose: () => controller.close(),
    })
  }

  const handleNewUnifiedItem = async (
    newItem: UnifiedItem,
    originalAddedItem: TemplateItem,
    closeEditModal: () => void,
  ) => {
    // For UnifiedItem, we need to check macro overflow

    const currentDayDiet_ = currentDayDiet()
    const macroTarget_ = getMacroTargetForDay(stringToDate(targetDay()))

    // Create context object once
    const macroOverflowContext = {
      currentDayDiet: currentDayDiet_,
      macroTarget: macroTarget_,
      macroOverflowOptions: { enable: true },
    }

    // Helper function for checking individual macro properties on the unified item
    const checkMacroOverflow = (property: keyof MacroNutrientsRecord) => {
      return isOverflow(originalAddedItem, property, macroOverflowContext)
    }

    const onConfirm = async () => {
      const userId = currentUserId()
      if (userId === undefined) {
        showError('Usuário não autenticado')
        return
      }

      props.onNewUnifiedItem?.(newItem, originalAddedItem)

      let type: 'food' | 'recipe'
      if (isFoodItem(originalAddedItem)) {
        type = 'food'
      } else if (isRecipeItem(originalAddedItem)) {
        type = 'recipe'
      } else {
        throw new Error('Invalid template item type')
      }

      const recentFood = await fetchRecentFoodByUserTypeAndReferenceId(
        userId,
        type,
        originalAddedItem.reference.id,
      )

      if (
        recentFood !== null &&
        (recentFood.user_id !== currentUserId() ||
          recentFood.type !== type ||
          recentFood.reference_id !== originalAddedItem.reference.id)
      ) {
        throw new Error(
          'BUG: recentFood fetched does not match user/type/reference',
        )
      }

      const recentFoodInput = createNewRecentFood({
        user_id: userId,
        type,
        reference_id: originalAddedItem.reference.id,
        last_used: new Date(),
        times_used: (recentFood?.times_used ?? 0) + 1,
      })

      if (recentFood !== null) {
        await updateRecentFood(recentFood.id, recentFoodInput)
      } else {
        await insertRecentFood(recentFoodInput)
      }

      const confirmModalId = openConfirmModal(
        'Deseja adicionar outro item ou finalizar a inclusão?',
        {
          title: 'Item adicionado com sucesso',
          confirmText: 'Finalizar',
          cancelText: 'Adicionar mais um item',
          onConfirm: () => {
            showSuccess(
              `Item "${originalAddedItem.name}" adicionado com sucesso!`,
            )
            props.onFinish?.()
            props.onClose?.()
            closeModal(confirmModalId)
          },
          onCancel: () => {
            showSuccess(
              `Item "${originalAddedItem.name}" adicionado com sucesso!`,
            )
            closeModal(confirmModalId)
          },
        },
      )
    }

    // Check if any macro nutrient would overflow
    const isOverflowing =
      checkMacroOverflow('carbs') ||
      checkMacroOverflow('protein') ||
      checkMacroOverflow('fat')

    if (isOverflowing) {
      // Prompt if user wants to add item even if it overflows
      const overflowModalId = openConfirmModal(
        'Os macros deste item ultrapassam as metas diárias. Deseja adicionar mesmo assim?',
        {
          title: 'Macros ultrapassam metas diárias',
          confirmText: 'Adicionar mesmo assim',
          cancelText: 'Cancelar',
          onConfirm: () => {
            onConfirm()
              .then(() => {
                closeModal(overflowModalId)
                closeEditModal()
              })
              .catch((err) => {
                logging.error(
                  'TemplateSearchModal Adicionar mesmo assim error:',
                  err,
                )
                showError(err, {}, 'Erro ao adicionar item')
                closeModal(overflowModalId)
              })
          },
          onCancel: () => {
            closeModal(overflowModalId)
          },
        },
      )
    } else {
      try {
        await onConfirm()
      } catch (err) {
        logging.error('TemplateSearchModal adicionar item error:', err)
        showError(err, {}, 'Erro ao adicionar item')
      }
    }
  }

  const handleEANModal = () => {
    openContentModal(
      (modalId) => (
        <EANInsertModal
          modalId={modalId}
          onSelect={(template: Template) => {
            handleTemplateSelected(template)
            closeModal(modalId)
          }}
          onClose={() => {
            closeModal(modalId)
          }}
        />
      ),
      {
        title: 'Pesquisar por código de barras',
        closeOnOutsideClick: false,
        closeOnEscape: true,
      },
    )
  }

  return (
    <div class="flex flex-col min-h-0 h-[60vh] sm:h-[80vh] sm:max-h-[70vh] p-2">
      <TemplateSearch
        onTemplateSelected={handleTemplateSelected}
        onEANModal={handleEANModal}
      />
    </div>
  )
}

export function TemplateSearch(props: {
  onTemplateSelected: (template: Template) => void
  onEANModal: () => void
}) {
  // TODO: Determine if user is on desktop or mobile to set autofocus
  const isDesktop = false

  createEffect(() => {
    setTemplateSearchTab(TEMPLATE_SEARCH_DEFAULT_TAB)
  })

  return (
    <>
      <div class="mb-2 flex gap-1 justify-end">
        <h3 class="text-md text-white my-auto w-full">
          Busca por nome ou código de barras
        </h3>
        <EANButton
          showEANModal={() => {
            props.onEANModal()
          }}
        />
      </div>

      <TemplateSearchTabs
        tab={templateSearchTab}
        setTab={setTemplateSearchTab}
      />
      <TemplateSearchBar isDesktop={isDesktop} />

      <Suspense
        fallback={
          <div class="flex flex-col items-center justify-center py-8 text-center">
            <PageLoading message="Carregando sistema de busca" />
          </div>
        }
      >
        <TemplateSearchResults
          search={debouncedSearch()}
          filteredTemplates={templates() ?? []}
          onTemplateSelected={props.onTemplateSelected}
          refetch={refetchTemplates}
        />
      </Suspense>
    </>
  )
}
