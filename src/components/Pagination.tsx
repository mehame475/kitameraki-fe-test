import { Button, Select, Text, makeStyles, tokens } from '@fluentui/react-components';
import { ChevronLeftRegular, ChevronRightRegular } from '@fluentui/react-icons';

export const PAGE_SIZES = [5, 10, 20, 50] as const;

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  group: { display: 'flex', alignItems: 'center', gap: tokens.spacingHorizontalS },
});

interface Props {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalItems,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: Props) {
  const styles = useStyles();
  const first = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, totalItems);

  return (
    <nav className={styles.root} aria-label="Pagination">
      <div className={styles.group}>
        <Text>Rows per page</Text>
        <Select
          size="small"
          aria-label="Rows per page"
          value={String(pageSize)}
          onChange={(_, data) => onPageSizeChange(Number(data.value))}
        >
          {PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      <div className={styles.group}>
        <Text>
          {first}–{last} of {totalItems}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronLeftRegular />}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <Text>
          Page {page} of {totalPages}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronRightRegular />}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}
