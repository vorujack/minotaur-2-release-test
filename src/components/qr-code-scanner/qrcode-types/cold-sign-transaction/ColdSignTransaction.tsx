import BackButton from '@/components/back-button/BackButton';
import AppFrame from '@/layouts/AppFrame';
import { Inventory2Outlined } from '@mui/icons-material';
import { Button, IconButton } from '@mui/material';
import React, { useState } from 'react';
import * as wasm from 'ergo-lib-wasm-browser';
import CenterMessage from '@/components/state-message/CenterMessage';
import SvgIcon from '@/icons/SvgIcon';
import TxSignValues from '@/pages/wallet-page/send/sign-tx/TxSignValues';
import Loading from '@/components/state-message/Loading';
import TransactionBoxes from '@/components/sign/transaction-boxes/TransactionBoxes';
import useBoxes from '@/hooks/useBoxes';
import { StateWallet } from '@/store/reducer/wallet';

interface ColdSignTransactionPropsType {
  scanned: string;
  close: () => unknown;
}

const ColdSignTransaction = (props: ColdSignTransactionPropsType) => {
  const [displayBoxes, setDisplayBoxes] = useState(false);
  const [tx, setTx] = useState<wasm.Transaction | undefined>();
  const [wallet, setWallet] = useState<StateWallet | undefined>();
  const boxes = useBoxes(tx, wallet);
  return (
    <AppFrame
      title="Cold Signing Transaction"
      navigation={<BackButton onClick={props.close} />}
      actions={
        tx ? (
          <IconButton onClick={() => setDisplayBoxes(true)}>
            <Inventory2Outlined />
          </IconButton>
        ) : undefined
      }
      toolbar={
        <Button disabled={false} onClick={() => null}>
          Publish
        </Button>
      }
    >
      {boxes.error ? (
        <CenterMessage
          icon={
            <SvgIcon
              icon="warning"
              color="error"
              style={{ marginBottom: -8 }}
            />
          }
          color="error.dark"
          description={[boxes.error]}
        />
      ) : tx && boxes ? (
        <React.Fragment>
          <TxSignValues tx={tx} boxes={boxes.boxes} wallet={wallet} />
          <TransactionBoxes
            open={displayBoxes}
            handleClose={() => setDisplayBoxes(false)}
          />
        </React.Fragment>
      ) : (
        <Loading description={['Loading transaction details']} />
      )}
    </AppFrame>
  );
};

export default ColdSignTransaction;
