import React, {
  useEffect, useReducer, useState, useCallback,
} from 'react';
import PropTypes from 'prop-types';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useModal } from '@trbl/react-modal';
import { v4 as uuidv4 } from 'uuid';

import withCondition from '../../withCondition';
import Button from '../../../elements/Button';
import AddRowModal from './AddRowModal';
import reducer from './reducer';
import DraggableSection from '../../DraggableSection';
import { useRenderedFields } from '../../RenderFields';
import Error from '../../Error';
import useFieldType from '../../useFieldType';
import { flexible } from '../../../../../validation/validations';

import './index.scss';

const baseClass = 'field-type flexible';

const Flexible = (props) => {
  const {
    label,
    name,
    path: pathFromProps,
    blocks,
    defaultValue,
    initialData,
    singularLabel,
    fieldTypes,
    maxRows,
    minRows,
    required,
    validate,
  } = props;

  const path = pathFromProps || name;

  const memoizedValidate = useCallback((value) => {
    const validationResult = validate(
      value,
      {
        minRows, maxRows, singularLabel, blocks, required,
      },
    );
    return validationResult;
  }, [validate, maxRows, minRows, singularLabel, blocks, required]);

  const {
    showError,
    errorMessage,
    value,
    setValue,
  } = useFieldType({
    path,
    validate: memoizedValidate,
    disableFormData: true,
    initialData: initialData?.length,
    defaultValue: defaultValue?.length,
    required,
  });

  const dataToInitialize = initialData || defaultValue;
  const { toggle: toggleModal, closeAll: closeAllModals } = useModal();
  const [rowIndexBeingAdded, setRowIndexBeingAdded] = useState(null);
  const [rowCount, setRowCount] = useState(dataToInitialize?.length || 0);
  const [rows, dispatchRows] = useReducer(reducer, []);
  const modalSlug = `flexible-${path}`;
  const { customComponentsPath } = useRenderedFields();

  const addRow = (index, blockType) => {
    dispatchRows({
      type: 'ADD', index, data: { blockType },
    });

    setValue(value + 1);
  };

  const removeRow = (index) => {
    dispatchRows({
      type: 'REMOVE',
      index,
    });

    setValue(value - 1);
  };

  const moveRow = (moveFromIndex, moveToIndex) => {
    dispatchRows({
      type: 'MOVE', index: moveFromIndex, moveToIndex,
    });
  };

  const openAddRowModal = (index) => {
    setRowIndexBeingAdded(index);
    toggleModal(modalSlug);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    moveRow(sourceIndex, destinationIndex);
  };

  useEffect(() => {
    setRowCount(dataToInitialize.length);

    dispatchRows({
      type: 'SET_ALL',
      payload: dataToInitialize.reduce((acc, data) => ([
        ...acc,
        {
          key: uuidv4(),
          open: true,
          data,
        },
      ]), []),
    });
  }, [dataToInitialize]);

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className={baseClass}>
          <header className={`${baseClass}__header`}>
            <h3>{label}</h3>
            <Error
              showError={showError}
              message={errorMessage}
            />
          </header>
          <Droppable droppableId="flexible-drop">
            {provided => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                {rows.length > 0 && rows.map((row, i) => {
                  let { blockType } = row;

                  if (!blockType) {
                    blockType = dataToInitialize?.[i]?.blockType;
                  }

                  const blockToRender = blocks.find(block => block.slug === blockType);

                  if (blockToRender) {
                    return (
                      <DraggableSection
                        isOpen={row.open}
                        fieldTypes={fieldTypes}
                        key={row.key}
                        id={row.key}
                        parentPath={path}
                        addRow={() => openAddRowModal(i)}
                        removeRow={() => removeRow(i)}
                        rowIndex={i}
                        fieldSchema={[
                          ...blockToRender.fields,
                          {
                            name: 'blockType',
                            type: 'text',
                            hidden: 'admin',
                          }, {
                            name: 'blockName',
                            type: 'text',
                            hidden: 'admin',
                          },
                        ]}
                        singularLabel={blockToRender?.labels?.singular}
                        initialData={row.data}
                        dispatchRows={dispatchRows}
                        blockType="flexible"
                        customComponentsPath={`${customComponentsPath}${name}.fields.`}
                      />
                    );
                  }

                  return null;
                })
                }
                {provided.placeholder}
              </div>
            )}
          </Droppable>

          <div className={`${baseClass}__add-button-wrap`}>
            <Button
              onClick={() => openAddRowModal(rowCount)}
              buttonStyle="secondary"
            >
              {`Add ${singularLabel}`}
            </Button>
          </div>
        </div>
      </DragDropContext>
      <AddRowModal
        closeAllModals={closeAllModals}
        addRow={addRow}
        rowIndexBeingAdded={rowIndexBeingAdded}
        slug={modalSlug}
        blocks={blocks}
      />
    </>
  );
};

Flexible.defaultProps = {
  label: '',
  defaultValue: [],
  initialData: [],
  singularLabel: 'Block',
  validate: flexible,
  required: false,
  maxRows: undefined,
  minRows: undefined,
};

Flexible.propTypes = {
  defaultValue: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  initialData: PropTypes.arrayOf(
    PropTypes.shape({}),
  ),
  blocks: PropTypes.arrayOf(
    PropTypes.shape({}),
  ).isRequired,
  label: PropTypes.string,
  singularLabel: PropTypes.string,
  name: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired,
  fieldTypes: PropTypes.shape({}).isRequired,
  validate: PropTypes.func,
  required: PropTypes.bool,
  maxRows: PropTypes.number,
  minRows: PropTypes.number,
};

export default withCondition(Flexible);
