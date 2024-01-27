import { ContentPasteOutlined, ShareOutlined } from '@mui/icons-material';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';
import { Button, Grid } from '@mui/material';
import React, { useContext, useState } from 'react';
import { validatePassword } from '@/action/wallet';
import { MultiSigContext } from '@/components/sign/context/MultiSigContext';
import { MultiSigDataContext } from '@/components/sign/context/MultiSigDataContext';
import { MultiSigShareData, MultiSigStateEnum } from '@/types/multi-sig';
import { commit, sign } from '@/action/multi-sig/signing';
import { TxDataContext } from '@/components/sign/context/TxDataContext';
import { readClipBoard } from '@/utils/clipboard';
import * as wasm from 'ergo-lib-wasm-browser';
import { updateMultiSigRow } from '@/action/multi-sig/store';
import getChain from '@/utils/networks';
import { StatusEnum } from '@/components/sign/context/TxSignContext';
import SuccessSend from '@/components/sign/success-send/SuccessSend';
import { QrCodeContext } from '@/components/qr-code-scanner/QrCodeContext';

const MultiSigToolbar = () => {
  const context = useContext(MultiSigContext);
  const data = useContext(TxDataContext);
  const multiSigData = useContext(MultiSigDataContext);
  const scanContext = useContext(QrCodeContext);
  const [status, setStatus] = useState<StatusEnum>(StatusEnum.WAITING);
  const [submitError, setSubmitError] = useState('');

  const getLabel = () => {
    switch (multiSigData.state) {
      case MultiSigStateEnum.SIGNING:
        return 'Sign Transaction';
      case MultiSigStateEnum.COMMITMENT:
        return 'Generate Commitment';
      case MultiSigStateEnum.COMPLETED:
        return 'Publish Transaction';
    }
  };

  const commitAction = () => {
    if (
      data.reduced &&
      multiSigData.related &&
      multiSigData.myAction.committed === false
    ) {
      return commit(
        data.reduced,
        data.wallet,
        multiSigData.related,
        context.password,
        data.boxes,
        context.data,
      ).then((res) => {
        if (res.changed) {
          context.setData(
            {
              commitments: res.commitments,
              secrets: res.secrets,
              signed: context.data.signed,
              simulated: context.data.simulated,
              partial: context.data.partial,
            },
            res.updateTime,
          );
          multiSigData.setNeedPassword(false);
        }
        return null;
      });
    }
  };

  const signAction = () => {
    if (multiSigData.related && data.reduced) {
      sign(
        data.wallet,
        multiSigData.related,
        context.data.simulated,
        context.data.commitments,
        context.data.secrets,
        multiSigData.committed,
        multiSigData.signed,
        multiSigData.addresses,
        data.reduced,
        data.boxes,
        context.password,
        context.data.partial,
      ).then((res) => {
        context.setData(
          {
            commitments: context.data.commitments,
            secrets: context.data.secrets,
            signed: res.signed,
            simulated: res.simulated,
            partial: res.partial,
          },
          res.currentTime,
        );
      });
    }
  };

  const processNewData = async (newContent: string) => {
    const clipBoardData = JSON.parse(newContent) as MultiSigShareData;
    const tx = wasm.ReducedTransaction.sigma_parse_bytes(
      Buffer.from(clipBoardData.tx, 'base64'),
    );
    if (tx.unsigned_tx().id().to_str() !== data.tx?.id().to_str()) {
      throw Error('Invalid transaction');
    }
    await updateMultiSigRow(
      context.rowId,
      clipBoardData.commitments,
      context.data.secrets,
      clipBoardData.signed || [],
      clipBoardData.simulated || [],
      Date.now(),
      clipBoardData.partial
        ? wasm.Transaction.sigma_parse_bytes(
            Buffer.from(clipBoardData.partial, 'base64'),
          )
        : undefined,
    );
  };

  const pasteAction = async () => {
    const clipBoardContent = await readClipBoard();
    processNewData(clipBoardContent);
  };
  const close = () => {
    setStatus(StatusEnum.WAITING);
  };

  const publishAction = async () => {
    if (context.data.partial) {
      return getChain(data.wallet.networkType)
        .getNetwork()
        .sendTx(context.data.partial)
        .then(() => {
          setStatus(StatusEnum.SENT);
        })
        .catch((err) => {
          if (err.response) {
            setSubmitError(err.response.data.reason);
          } else {
            setSubmitError('unknown error occurred. check application logs');
            console.log(err);
          }
          setStatus(StatusEnum.ERROR);
        });
    } else {
      setSubmitError('unknown error occurred. check application logs');
      setStatus(StatusEnum.ERROR);
    }
  };

  const act = async () => {
    switch (multiSigData.state) {
      case MultiSigStateEnum.SIGNING:
        return await signAction();
      case MultiSigStateEnum.COMMITMENT:
        return await commitAction();
      case MultiSigStateEnum.COMPLETED:
        return await publishAction();
    }
  };

  const startScanner = () => {
    scanContext
      .start()
      .then(processNewData)
      .catch((reason: string) => console.log('scanning failed ', reason));
  };

  const allowAction = () => {
    switch (multiSigData.state) {
      case MultiSigStateEnum.COMPLETED:
        return true;
      case MultiSigStateEnum.SIGNING:
        return !multiSigData.myAction.signed;
      case MultiSigStateEnum.COMMITMENT:
        return !multiSigData.myAction.committed;
    }
  };
  const passwordInvalid =
    multiSigData.related !== undefined &&
    !validatePassword(multiSigData.related.seed, context.password);

  return (
    <React.Fragment>
      <Grid container spacing={2}>
        {allowAction() ? (
          <Grid item xs={12}>
            <Button
              onClick={act}
              startIcon={
                multiSigData.state === MultiSigStateEnum.COMPLETED ? (
                  <ShareOutlined />
                ) : null
              }
              disabled={
                passwordInvalid &&
                multiSigData.state !== MultiSigStateEnum.COMPLETED
              }
            >
              {getLabel()}
            </Button>
          </Grid>
        ) : null}
        {multiSigData.state === MultiSigStateEnum.COMPLETED ? null : (
          <React.Fragment>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                onClick={pasteAction}
                startIcon={<ContentPasteOutlined />}
              >
                Paste
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button
                variant="outlined"
                onClick={startScanner}
                startIcon={<QrCodeScannerIcon />}
              >
                Scan QrCode
              </Button>
            </Grid>
          </React.Fragment>
        )}
      </Grid>
      <SuccessSend
        networkType={data.wallet.networkType}
        open={status === StatusEnum.SENT || status === StatusEnum.ERROR}
        id={
          status === StatusEnum.SENT && context.data.partial
            ? context.data.partial.id().to_str()
            : undefined
        }
        isSuccess={status === StatusEnum.SENT}
        msg={
          status === StatusEnum.SENT
            ? 'It can take about 2 minutes to mine your transaction. Also syncing your wallet may be slow.'
            : submitError
        }
        handleClose={close}
      />
    </React.Fragment>
  );
};

export default MultiSigToolbar;
