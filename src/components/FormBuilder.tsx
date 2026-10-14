import { useState, type ReactElement, type ReactNode } from 'react';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { Badge, Text, makeStyles, mergeClasses, shorthands, tokens } from '@fluentui/react-components';
import {
  CalendarClockRegular,
  CalendarLtrRegular,
  MailRegular,
  ReOrderDotsVerticalRegular,
  TextFieldRegular,
} from '@fluentui/react-icons';
import {
  CUSTOM_FIELD_TYPES,
  CUSTOM_TYPE_LABEL,
  type CustomFieldType,
  type FormField,
  type FormRow,
  type FormSettings,
} from '../types/formSettings';
import { addField, createCustomField, fieldTypeLabel, moveField, type DropTarget } from '../utils/formLayout';

type DragData = { source: 'palette'; type: CustomFieldType } | { source: 'field'; fieldId: string };

const TYPE_ICON: Record<CustomFieldType, ReactElement> = {
  text: <TextFieldRegular />,
  date: <CalendarLtrRegular />,
  datetime: <CalendarClockRegular />,
  email: <MailRegular />,
};

const useStyles = makeStyles({
  layout: {
    display: 'grid',
    gridTemplateColumns: '220px minmax(0, 1fr) 280px',
    gap: tokens.spacingHorizontalL,
    alignItems: 'start',
    '@media (max-width: 960px)': { gridTemplateColumns: '1fr' },
  },
  panel: {
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke2),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
    padding: tokens.spacingVerticalM,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  palette: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  paletteItem: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground2,
    cursor: 'grab',
    ':hover': { backgroundColor: tokens.colorNeutralBackground2Hover },
  },
  canvas: { minHeight: '320px' },
  gap: { height: '20px', ...shorthands.borderRadius(tokens.borderRadiusSmall) },
  gapActive: { backgroundColor: tokens.colorNeutralBackground3 },
  gapOver: { backgroundColor: tokens.colorBrandBackground },
  row: { position: 'relative', display: 'flex', gap: tokens.spacingHorizontalM },
  card: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    padding: tokens.spacingVerticalS,
    ...shorthands.border('1px', 'solid', tokens.colorNeutralStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
    cursor: 'grab',
    ':hover': { backgroundColor: tokens.colorNeutralBackground1Hover },
  },
  cardSelected: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    boxShadow: `0 0 0 1px ${tokens.colorBrandStroke1}`,
  },
  cardDragging: { opacity: 0.4 },
  cardSwapOver: { backgroundColor: tokens.colorBrandBackground2 },
  cardText: { display: 'flex', flexDirection: 'column', minWidth: 0, flexGrow: 1 },
  cardLabel: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // Drop target for the second column of a single-field row: an overlay on the right half
  // (pointer-events: none keeps the card clickable; dnd-kit hit-tests by rectangle).
  slot: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
  },
  slotActive: {
    ...shorthands.border('1px', 'dashed', tokens.colorNeutralStroke1),
    backgroundColor: tokens.colorNeutralBackground1,
    opacity: 0.9,
  },
  slotOver: {
    ...shorthands.borderColor(tokens.colorBrandStroke1),
    backgroundColor: tokens.colorBrandBackground2,
  },
  overlay: {
    padding: tokens.spacingVerticalS,
    ...shorthands.border('1px', 'solid', tokens.colorBrandStroke1),
    ...shorthands.borderRadius(tokens.borderRadiusMedium),
    backgroundColor: tokens.colorNeutralBackground1,
    boxShadow: tokens.shadow8,
  },
});

// palette
function PaletteItem({ type, onAdd }: { type: CustomFieldType; onAdd: (type: CustomFieldType) => void }) {
  const styles = useStyles();
  const data: DragData = { source: 'palette', type };
  const { attributes, listeners, setNodeRef } = useDraggable({ id: `palette:${type}`, data });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={styles.paletteItem}
      title="Click to add to the end of the form, or drag it onto the form"
      onClick={() => onAdd(type)}
    >
      {TYPE_ICON[type]}
      <Text>{CUSTOM_TYPE_LABEL[type]}</Text>
    </div>
  );
}

// canvas
function Gap({ id, dragging }: { id: string; dragging: boolean }) {
  const styles = useStyles();
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={mergeClasses(styles.gap, dragging && styles.gapActive, isOver && styles.gapOver)}
    />
  );
}

interface CardProps {
  field: FormField;
  selected: boolean;
  // Only dragging an existing field makes other cards swap targets
  swapEnabled: boolean;
  onSelect: (id: string) => void;
}

function BuilderField({ field, selected, swapEnabled, onSelect }: CardProps) {
  const styles = useStyles();
  const data: DragData = { source: 'field', fieldId: field.id };
  const drag = useDraggable({ id: `field:${field.id}`, data });
  const drop = useDroppable({ id: `swap:${field.id}`, disabled: drag.isDragging || !swapEnabled });

  const setRef = (node: HTMLElement | null) => {
    drag.setNodeRef(node);
    drop.setNodeRef(node);
  };

  return (
    <div
      ref={setRef}
      {...drag.attributes}
      {...drag.listeners}
      className={mergeClasses(
        styles.card,
        selected && styles.cardSelected,
        drag.isDragging && styles.cardDragging,
        drop.isOver && styles.cardSwapOver,
      )}
      onClick={() => onSelect(field.id)}
    >
      <ReOrderDotsVerticalRegular />
      <div className={styles.cardText}>
        <Text weight="semibold" className={styles.cardLabel}>
          {field.label || '(no label)'}
        </Text>
        <Text size={200}>{fieldTypeLabel(field)}</Text>
      </div>
      {field.kind === 'builtin' && (
        <Badge appearance="outline" size="small">
          Built-in
        </Badge>
      )}
    </div>
  );
}

interface RowProps {
  row: FormRow;
  selectedId: string | null;
  active: DragData | null;
  onSelect: (id: string) => void;
}

function BuilderRow({ row, selectedId, active, onSelect }: RowProps) {
  const styles = useStyles();
  const single = row.fields.length === 1;
  const draggingOwnField = active?.source === 'field' && row.fields.some((f) => f.id === active.fieldId);
  const slot = useDroppable({ id: `slot:${row.id}`, disabled: !single || draggingOwnField });

  return (
    <div className={styles.row}>
      {row.fields.map((field) => (
        <BuilderField
          key={field.id}
          field={field}
          selected={field.id === selectedId}
          swapEnabled={active?.source === 'field'}
          onSelect={onSelect}
        />
      ))}
      {single && (
        <div
          ref={slot.setNodeRef}
          className={mergeClasses(
            styles.slot,
            active !== null && !draggingOwnField && styles.slotActive,
            slot.isOver && styles.slotOver,
          )}
        >
          {active !== null && !draggingOwnField && <Text size={200}>Drop to add a column</Text>}
        </div>
      )}
    </div>
  );
}

// drag and drop
const rank = (id: string | number) => {
  const s = String(id);
  return s.startsWith('slot:') ? 0 : s.startsWith('gap:') ? 1 : 2;
};

// Pointer position decides the target (slots win over the card underneath); keyboard uses centers
const collisionDetection: CollisionDetection = (args) => {
  if (!args.pointerCoordinates) return closestCenter(args);
  return pointerWithin(args).sort((a, b) => rank(a.id) - rank(b.id));
};

function parseTarget(id: string): DropTarget | null {
  const [kind, value] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
  if (kind === 'gap') return { kind: 'gap', beforeRowId: value === 'end' ? null : value };
  if (kind === 'slot') return { kind: 'slot', rowId: value };
  if (kind === 'swap') return { kind: 'swap', fieldId: value };
  return null;
}

interface Props {
  settings: FormSettings;
  onChange: (next: FormSettings) => void;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  // Content of the right-hand panel (the properties of the selected field)
  sidePanel: ReactNode;
}

// Palette + canvas of the form builder, wired with dnd-kit
export function FormBuilder({ settings, onChange, selectedId, onSelect, sidePanel }: Props) {
  const styles = useStyles();
  const [active, setActive] = useState<DragData | null>(null);

  // A small drag distance keeps plain clicks (select / add) working on draggable elements
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const addAtEnd = (type: CustomFieldType) => {
    const field = createCustomField(type);
    onChange(addField(settings, field));
    onSelect(field.id);
  };

  const handleDragStart = (event: DragStartEvent) => setActive(event.active.data.current as DragData);

  const handleDragEnd = (event: DragEndEvent) => {
    const data = event.active.data.current as DragData | undefined;
    setActive(null);
    if (!data || !event.over) return;
    const target = parseTarget(String(event.over.id));
    if (!target) return;

    if (data.source === 'palette') {
      if (target.kind === 'swap') return;
      const field = createCustomField(data.type);
      onChange(addField(settings, field, target));
      onSelect(field.id);
    } else {
      onChange(moveField(settings, data.fieldId, target));
    }
  };

  const overlayLabel =
    active?.source === 'palette'
      ? CUSTOM_TYPE_LABEL[active.type]
      : active
        ? (settings.rows.flatMap((r) => r.fields).find((f) => f.id === active.fieldId)?.label ?? '')
        : '';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActive(null)}
    >
      <div className={styles.layout}>
        <section className={styles.panel} aria-label="Field types">
          <Text weight="semibold">Add a field</Text>
          <Text size={200}>Drag onto the form, or click to add at the end.</Text>
          <div className={styles.palette}>
            {CUSTOM_FIELD_TYPES.map((type) => (
              <PaletteItem key={type} type={type} onAdd={addAtEnd} />
            ))}
          </div>
        </section>

        <section className={mergeClasses(styles.panel, styles.canvas)} aria-label="Form layout">
          {settings.rows.map((row) => (
            <div key={row.id}>
              <Gap id={`gap:${row.id}`} dragging={active !== null} />
              <BuilderRow row={row} selectedId={selectedId} active={active} onSelect={onSelect} />
            </div>
          ))}
          <Gap id="gap:end" dragging={active !== null} />
        </section>

        <section className={styles.panel} aria-label="Field properties">
          <Text weight="semibold">Properties</Text>
          {sidePanel}
        </section>
      </div>

      <DragOverlay>{active ? <div className={styles.overlay}>{overlayLabel}</div> : null}</DragOverlay>
    </DndContext>
  );
}
