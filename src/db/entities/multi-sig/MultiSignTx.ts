import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import Wallet from '../Wallet';
import MultiSignRow from './MultiSignRow';

enum MultiSigTxType {
  Reduced = 'REDUCED',
  Partial = 'PARTIAL',
}

@Entity({ name: 'multi-sign-tx' })
class MultiSigSignTx {
  @PrimaryGeneratedColumn()
  id = 0;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  tx: MultiSignRow | null = null;

  @Column('text')
  bytes = '';

  @Column('int')
  idx = 0;

  @Column('text')
  type: MultiSigTxType = MultiSigTxType.Reduced;
}

export default MultiSigSignTx;
export { MultiSigTxType };
