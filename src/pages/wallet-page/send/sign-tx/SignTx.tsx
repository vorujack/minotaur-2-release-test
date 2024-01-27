import { Box, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import React, { useContext, useEffect } from 'react';
import { TxDataContext } from '@/components/sign/context/TxDataContext';
import TxGenerateContext from '@/components/sign/context/TxGenerateContext';
import TxSignContext, {
  StatusEnum,
} from '@/components/sign/context/TxSignContext';
import StateMessage from '@/components/state-message/StateMessage';
import { StateWallet } from '@/store/reducer/wallet';
import SigningSwitch from './SigningSwitch';
import TxSignValues from './TxSignValues';
import DisplayQRCode from '@/components/display-qrcode/DisplayQRCode';
import { QrCodeTypeEnum } from '@/types/qrcode';

interface SignTxPropsType {
  wallet: StateWallet;
  hideLoading?: boolean;
  setHasError: (hasError: boolean) => unknown;
}

const SignTx = (props: SignTxPropsType) => {
  const txSignContext = useContext(TxSignContext);
  const txDataContext = useContext(TxDataContext);
  const generatorContext = useContext(TxGenerateContext);
  useEffect(() => {
    generatorContext.setReady(true);
  });
  if (txDataContext.tx) {
    if (
      txSignContext.status === StatusEnum.SENDING ||
      txSignContext.status === StatusEnum.SIGNING
    ) {
      return (
        <Box
          sx={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <StateMessage
            title={
              txSignContext.status === StatusEnum.SIGNING
                ? 'Signing Transaction'
                : 'Sending Transaction to Blockchain'
            }
            description="Please wait"
            icon={<CircularProgress />}
          />
        </Box>
      );
    }
    return (
      <React.Fragment>
        <TxSignValues
          tx={txDataContext.tx}
          boxes={txDataContext.boxes}
          wallet={props.wallet}
        />
        {txSignContext.signed ? (
          <React.Fragment>
            <Typography>
              Please scan this code on your hot wallet to submit transaction
            </Typography>
            <DisplayQRCode
              value={txSignContext.signed}
              type={QrCodeTypeEnum.ColdSignTransaction}
            />
          </React.Fragment>
        ) : (
          <SigningSwitch
            wallet={props.wallet}
            setHasError={props.setHasError}
          />
        )}
      </React.Fragment>
    );
  }
  return props.hideLoading === true ? undefined : (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
      }}
    >
      <StateMessage
        title="Generating Transaction"
        description="Please wait"
        icon={<CircularProgress />}
      />
    </Box>
  );
};

export default SignTx;
