import { Box, IconButton, Stack, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useContext, useEffect, useState } from 'react';
import { BoxContent } from '../../../types/sign-modal';
import {
  boxesToContent,
  createEmptyArrayWithIndex,
} from '../../../utils/functions';
import { TxDataContext } from '../context/TxDataContext';
import BoxItem from './BoxItem';
import Drawer from '@mui/material/Drawer';

interface TransactionBoxesPropsType {
  open: boolean;
  handleClose: () => void;
}

const TransactionBoxes = (props: TransactionBoxesPropsType) => {
  const [txId, setTxId] = useState('');
  const [loading, setLoading] = useState(false);
  const [inputBoxes, setInputBoxes] = useState<Array<BoxContent>>([]);
  const [outputBoxes, setOutputBoxes] = useState<Array<BoxContent>>([]);
  const [walletId, setWalletId] = useState(-1);
  const context = useContext(TxDataContext);
  useEffect(() => {
    if (context.tx && !loading) {
      const unsigned = context.tx;
      if (unsigned.id().to_str() !== txId || walletId !== context.wallet.id) {
        setLoading(true);
        const processingWalletId = context.wallet.id;
        const inputsWasm = unsigned.inputs();
        const inputs = createEmptyArrayWithIndex(inputsWasm.len()).map(
          (index) => {
            const input = inputsWasm.get(index);
            const box = context.boxes.filter(
              (item) => item.box_id().to_str() === input.box_id().to_str(),
            );
            if (box.length !== 0) {
              return box[0];
            }
            return box[index];
          },
        );
        setInputBoxes(boxesToContent(context.networkType, inputs));
        const outputCandidates = unsigned.output_candidates();
        const outputs = createEmptyArrayWithIndex(outputCandidates.len()).map(
          (index) => outputCandidates.get(index),
        );
        setOutputBoxes(boxesToContent(context.networkType, outputs));
        setTxId(unsigned.id().to_str());
        setWalletId(processingWalletId);
        setLoading(false);
      }
    }
  }, [
    context.tx,
    context.networkType,
    context.boxes,
    loading,
    txId,
    context.wallet,
    walletId,
  ]);
  return (
    <Drawer
      anchor="bottom"
      open={props.open}
      onClose={props.handleClose}
      PaperProps={{
        sx: { p: 3, pt: 1, borderTopRightRadius: 20, borderTopLeftRadius: 20 },
      }}
    >
      <Box display="flex" mb={2}>
        <Box sx={{ flexBasis: 40 }} />
        <Typography variant="h1" textAlign="center" sx={{ p: 1 }}>
          Boxes
        </Typography>
        <IconButton onClick={props.handleClose}>
          <CloseIcon />
        </IconButton>
      </Box>

      <Typography variant="h2">Transaction Inputs</Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        These elements spent in transaction
      </Typography>
      <Stack spacing={1}>
        {inputBoxes.map((item, index) => (
          <BoxItem
            tokens={item.tokens}
            networkType={context.networkType}
            address={item.address}
            amount={item.amount}
            key={index}
            wallet={context.wallet}
          />
        ))}
      </Stack>

      <Typography variant="h2" sx={{ mt: 3 }}>
        Transaction Outputs
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
        These elements will be created in transaction
      </Typography>
      <Stack spacing={1}>
        {outputBoxes.map((item, index) => (
          <BoxItem
            tokens={item.tokens}
            networkType={context.networkType}
            address={item.address}
            amount={item.amount}
            key={index}
            wallet={context.wallet}
          />
        ))}
      </Stack>
    </Drawer>
  );
};

export default TransactionBoxes;
