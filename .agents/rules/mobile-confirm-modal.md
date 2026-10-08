# Reusable Confirmation Modal Standard (No Native Alert Dialogs)

All confirmation dialogs, deletion prompts, discard warnings, and action verifications across the React Native mobile application (`app/`) MUST use the shared `ConfirmModal` component (`app/src/components/ConfirmModal.tsx`).

## Rules & Guidelines

1. **No React Native `Alert.alert` or System Popups**:
   - Never use React Native's native `Alert.alert` or unstyled dialogs for action confirmations (e.g. deleting team members, removing records, discarding unsaved changes, logging out).
   - Native dialogs break design system harmony, cannot be branded or themed, and provide an inconsistent visual experience between iOS and Android.

2. **Always Use Reusable `ConfirmModal` (`app/src/components/ConfirmModal.tsx`)**:
   - Import `ConfirmModal` directly from the shared components index (`import { ConfirmModal } from '../../components'`).
   - Standard Props:
     - `visible`: Controlled boolean modal visibility state.
     - `title`: Clear, localized dialog heading (e.g. `t('deleteConfirmTitle')`).
     - `message`: Descriptive message or consequence warning (e.g. `t('deleteConfirmMessage')`).
     - `confirmText`: Localized confirmation button label (e.g. `t('delete')` or `t('confirm')`).
     - `cancelText`: Localized dismissal button label (e.g. `t('cancel')`).
     - `variant`: Semantic theme variant (`'danger'` for deletions/destructive actions, `'warning'`, `'info'`, `'success'`, or `'primary'`).
     - `isLoading`: Tracks asynchronous operation progress (shows loading spinner and disables dismissal while in-flight).
     - `onConfirm`: Callback invoked when user confirms the action.
     - `onDismiss`: Callback invoked to close or cancel the modal.

3. **Standard State Handling Pattern**:
   - Hold the target record or open state in local component state:
     ```tsx
     const [itemToDelete, setItemToDelete] = useState<ItemType | null>(null);

     const handleDeletePress = useCallback((item: ItemType) => {
       setItemToDelete(item);
     }, []);

     const handleConfirmDelete = useCallback(() => {
       if (itemToDelete) {
         dispatch(deleteAction(itemToDelete.id, () => setItemToDelete(null)));
       }
     }, [dispatch, itemToDelete]);
     ```
   - Render `<ConfirmModal />` once at the screen or root component level:
     ```tsx
     <ConfirmModal
       visible={Boolean(itemToDelete)}
       title={t('deleteConfirmTitle')}
       message={itemToDelete ? `${t('deleteConfirmMessage')} (${itemToDelete.name})` : ''}
       confirmText={t('delete')}
       cancelText={t('cancel')}
       variant="danger"
       isLoading={isSubmitting}
       onDismiss={() => !isSubmitting && setItemToDelete(null)}
       onConfirm={handleConfirmDelete}
     />
     ```

4. **Strict Localization Requirement**:
   - Modal titles, descriptions, and button labels must strictly use localized translation strings through `useLanguage().t` (`app/src/languages/en.ts` and `app/src/languages/hi.ts`).
