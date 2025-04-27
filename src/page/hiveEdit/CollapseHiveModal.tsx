import { useState } from 'react';
import { useMutation } from 'urql';
import T from '@/shared/translate';
import Modal from '@/shared/modal'; // Assuming a shared Modal component exists
import Input from '@/shared/input'; // Assuming a shared Input component exists
import Button from '@/shared/button'; // Assuming a shared Button component exists
import { h } from 'preact'; // Import h from preact
import inputStyles from '@/shared/input/styles.module.less'; // Import input styles for label and textarea
import modalStyles from '@/shared/modal/styles.module.less'; // Import modal styles for button container
import MessageError from '@/shared/messageError';

// Define the GraphQL mutation
const MARK_HIVE_AS_COLLAPSED_MUTATION = `
  mutation MarkHiveAsCollapsed($id: ID!, $collapseDate: DateTime!, $collapseCause: String!) {
    markHiveAsCollapsed(id: $id, collapseDate: $collapseDate, collapseCause: $collapseCause) {
      id
      status
      collapse_date
      collapse_cause
    }
  }
`;

interface CollapseHiveModalProps {
  hiveId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CollapseHiveModal({ hiveId, onClose, onSuccess }: CollapseHiveModalProps) {
  const [collapseDate, setCollapseDate] = useState('2025-04-27'); // Initialize with current date
  const [collapseCause, setCollapseCause] = useState('');
  const [mutationResult, markHiveAsCollapsed] = useMutation(MARK_HIVE_AS_COLLAPSED_MUTATION);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!collapseDate || !collapseCause) {
      setError('Please provide both date and cause.');
      return;
    }

    // Execute the mutation
    const result = await markHiveAsCollapsed({
      id: hiveId,
      collapseDate: collapseDate, // Ensure format matches backend expectation (DateTime)
      collapseCause: collapseCause,
    });

    console.log({result})

    if (result.error) {
      setError(result.error.message || 'Error marking hive as collapsed.');
    } else if(result.data) {
      onSuccess();
    }
  };

  return (
    <Modal title={<T>Mark Hive as Collapsed</T>} onClose={onClose}>
      <div>
        <MessageError error={error} />
        <p><T>Please provide details about the hive collapse.</T></p>
        <Input
          label={<T>Date of Collapse</T>}
          type="date"
          value={collapseDate}
          onChange={(e: h.JSX.TargetedEvent<HTMLInputElement, Event>) => setCollapseDate((e.target as HTMLInputElement).value)}
        />
        <label className={inputStyles.label}><T>Cause</T></label>
        <textarea
          className={inputStyles.input}
          rows={2}
          value={collapseCause}
          onChange={(e: h.JSX.TargetedEvent<HTMLTextAreaElement, Event>) => setCollapseCause((e.target as HTMLTextAreaElement).value)}
        />
        <div className={modalStyles.centeredButtonContainer}>
          <Button onClick={handleSubmit} loading={mutationResult.fetching}>
            <T>Confirm</T>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
