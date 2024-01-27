import * as wasm from 'ergo-lib-wasm-browser';
import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { multiSigStoreNewTx } from '../../../action/multi-sig/store';
import {
  signNormalWalletReducedTx,
  signNormalWalletTx,
} from '../../../action/tx';
import { WalletType } from '../../../db/entities/Wallet';
import { StateWallet } from '../../../store/reducer/wallet';
import getChain from '../../../utils/networks';
import SuccessSend from '../success-send/SuccessSend';
import TxDataContextHandler from './TxDataContextHandler';
import TxSignContext, { StatusEnum } from './TxSignContext';
import { RouteMap, getRoute } from '../../../router/routerMap';
import { QrCodeContext } from '@/components/qr-code-scanner/QrCodeContext';

interface TxSignContextHandlerPropsType {
  wallet: StateWallet;
  children: React.ReactNode;
  close?: () => unknown;
  denySubmit?: boolean;
}

const TxSignContextHandler = (props: TxSignContextHandlerPropsType) => {
  const navigate = useNavigate();
  const [tx, setTx] = useState<wasm.UnsignedTransaction | undefined>();
  const [reduced, setReducedTx] = useState<
    wasm.ReducedTransaction | undefined
  >();
  const [boxes, setBoxes] = useState<Array<wasm.ErgoBox>>([]);
  const [dataBoxes, setDataBoxes] = useState<Array<wasm.ErgoBox>>([]);
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<StatusEnum>(StatusEnum.WAITING);
  const [submitError, setSubmitError] = useState('');
  const [signedStr, setSignedStr] = useState('');
  const qrCodeContext = useContext(QrCodeContext);
  const setTransactionDetail = (
    tx: wasm.UnsignedTransaction | undefined,
    boxes: Array<wasm.ErgoBox>,
    dataBoxes?: Array<wasm.ErgoBox>,
  ) => {
    setTx(tx);
    setBoxes(boxes);
    setDataBoxes(dataBoxes ?? []);
  };
  const setReducedTransactionDetail = (
    reducedTx: wasm.ReducedTransaction | undefined,
  ) => {
    if (
      reducedTx?.unsigned_tx().id().to_str() !==
      reduced?.unsigned_tx().id().to_str()
    ) {
      setReducedTx(reducedTx);
    }
  };

  const close = () => {
    if (status === StatusEnum.SENT) {
      if (props.close) {
        props.close();
      } else {
        navigate(-1);
      }
    } else {
      setStatus(StatusEnum.WAITING);
    }
  };

  const submitTx = (signed: wasm.Transaction) => {
    setStatus(StatusEnum.SENDING);
    return getChain(props.wallet.networkType)
      .getNetwork()
      .sendTx(signed)
      .then(() => {
        setStatus(StatusEnum.SENT);
        setPassword('');
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
  };

  const handleNormalReducedTx = () => {
    if (reduced) {
      return signNormalWalletReducedTx(props.wallet, password, reduced).then(
        (signed) => {
          if (props.denySubmit) {
            setSignedStr(
              JSON.stringify({
                signedTx: Buffer.from(signed.sigma_serialize_bytes()).toString(
                  'base64',
                ),
              }),
            );
          } else {
            submitTx(signed);
          }
        },
      );
    }
  };

  const handleNormalTx = () => {
    if (tx) {
      setStatus(StatusEnum.SIGNING);
      return signNormalWalletTx(
        props.wallet,
        password,
        tx,
        boxes,
        dataBoxes,
      ).then(submitTx);
    }
  };

  const handle = async () => {
    if (tx && status === StatusEnum.WAITING) {
      switch (props.wallet.type) {
        case WalletType.Normal:
          if (
            reduced &&
            reduced.unsigned_tx().id().to_str() === tx.id().to_str()
          ) {
            await handleNormalReducedTx();
          } else {
            await handleNormalTx();
          }
          break;
        case WalletType.ReadOnly:
          qrCodeContext.start();
          break;
        case WalletType.MultiSig:
          if (reduced) {
            await multiSigStoreNewTx(reduced, boxes, props.wallet);
            props.close ? props.close() : navigate(-1);
            navigate(
              getRoute(RouteMap.WalletMultiSig, { id: props.wallet.id }),
            );
            navigate(
              getRoute(RouteMap.WalletMultiSigTxView, {
                id: props.wallet.id,
                txId: reduced.unsigned_tx().id().to_str(),
              }),
            );
          }
          break;
        default:
      }
    }
  };
  return (
    <TxSignContext.Provider
      value={{
        setReducedTx: setReducedTransactionDetail,
        networkType: props.wallet.networkType,
        password,
        handle,
        status,
        setPassword,
        setTx: setTransactionDetail,
        signed: signedStr,
      }}
    >
      <TxDataContextHandler
        wallet={props.wallet}
        boxes={boxes}
        dataBoxes={dataBoxes}
        reduced={reduced}
        tx={tx}
      >
        {props.children}
      </TxDataContextHandler>
      <SuccessSend
        networkType={props.wallet.networkType}
        open={status === StatusEnum.SENT || status === StatusEnum.ERROR}
        id={status === StatusEnum.SENT && tx ? tx.id().to_str() : undefined}
        isSuccess={status === StatusEnum.SENT}
        msg={
          status === StatusEnum.SENT
            ? 'It can take about 2 minutes to mine your transaction. Also syncing your wallet may be slow.'
            : submitError
        }
        handleClose={close}
      />
    </TxSignContext.Provider>
  );
};

export default TxSignContextHandler;
