import { useState } from "react";
import {
  Modal,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
} from "@mui/material";

export interface ItemModal {
  id: number;
  name: string;
}

interface SelectionModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (id: number) => void;
  items: ItemModal[];
}

const modalStyle = {
  position: "absolute",
  top: "40%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "40%",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
} as const;

const SelectionModal: React.FC<SelectionModalProps> = ({
  open,
  onClose,
  onSelect,
  items,
}) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (id: number) => {
    setSelectedId(id);
  };

  const handleConfirm = () => {
    if (selectedId !== null) {
      onSelect(selectedId);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
    >
      <Box sx={modalStyle}>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
        >
          Selecione um Item
        </Typography>
        <Divider />
        <List sx={{ maxHeight: 300, overflow: "auto" }}>
          {items.map((item) => (
            <ListItem
              key={item.id}
              selected={selectedId === item.id}
              onClick={() => handleSelect(item.id)}
              sx={{ cursor: "pointer" }}
            >
              <ListItemText primary={item.name} />
            </ListItem>
          ))}
        </List>
        <Divider />
        <Box
          sx={{ mt: 2, display: "flex", justifyContent: "flex-end", gap: 1 }}
        >
          <Button
            onClick={onClose}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            disabled={selectedId === null}
          >
            Confirmar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default SelectionModal;
