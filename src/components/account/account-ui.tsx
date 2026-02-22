import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import {
  useGetBalance,
  useGetTokenAccountBalance,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from "./account-data-access";
import { View, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { Text, Button, Input } from "../ui";
import { useState, useMemo } from "react";
import { ellipsify } from "../../utils/ellipsify";
import { AppModal } from "../ui/app-modal";
import { colors, spacing } from "../../theme/shadcn-theme";

function lamportsToSol(balance: number) {
  return Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000;
}

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address });
  return (
    <>
      <View style={styles.accountBalance}>
        <Text variant="h4">Current Balance</Text>
        <Text variant="h2">
          {query.data ? lamportsToSol(query.data) : "..."} SOL
        </Text>
      </View>
    </>
  );
}

export function AccountButtonGroup({ address }: { address: PublicKey }) {
  const requestAirdrop = useRequestAirdrop({ address });
  const [showAirdropModal, setShowAirdropModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);

  return (
    <>
      <View style={styles.accountButtonGroup}>
        <AirdropRequestModal
          hide={() => setShowAirdropModal(false)}
          show={showAirdropModal}
          address={address}
        />
        <TransferSolModal
          hide={() => setShowSendModal(false)}
          show={showSendModal}
          address={address}
        />
        <ReceiveSolModal
          hide={() => setShowReceiveModal(false)}
          show={showReceiveModal}
          address={address}
        />
        <Button
          disabled={requestAirdrop.isPending}
          onPress={() => {
            setShowAirdropModal(true);
          }}
        >
          Airdrop
        </Button>
        <Button
          onPress={() => setShowSendModal(true)}
          style={{ marginLeft: 6 }}
        >
          Send
        </Button>
        <Button
          onPress={() => setShowReceiveModal(true)}
          style={{ marginLeft: 6 }}
        >
          Receive
        </Button>
      </View>
    </>
  );
}

export function AirdropRequestModal({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const requestAirdrop = useRequestAirdrop({ address });

  return (
    <AppModal
      title="Request Airdrop"
      hide={hide}
      show={show}
      submit={() => {
        requestAirdrop.mutateAsync(1).catch((err) => console.log(err));
      }}
      submitLabel="Request"
      submitDisabled={requestAirdrop.isPending}
    >
      <View style={{ padding: 4 }}>
        <Text variant="p">
          Request an airdrop of 1 SOL to your connected wallet account.
        </Text>
      </View>
    </AppModal>
  );
}

export function TransferSolModal({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  const transferSol = useTransferSol({ address });
  const [destinationAddress, setDestinationAddress] = useState("");
  const [amount, setAmount] = useState("");
  return (
    <AppModal
      title="Send SOL"
      hide={hide}
      show={show}
      submit={() => {
        transferSol
          .mutateAsync({
            destination: new PublicKey(destinationAddress),
            amount: parseFloat(amount),
          })
          .then(() => hide());
      }}
      submitLabel="Send"
      submitDisabled={!destinationAddress || !amount}
    >
      <View style={{ padding: 20 }}>
        <Input
          placeholder="Amount (SOL)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          style={{ marginBottom: 20 }}
        />
        <Input
          placeholder="Destination Address"
          value={destinationAddress}
          onChangeText={setDestinationAddress}
        />
      </View>
    </AppModal>
  );
}

export function ReceiveSolModal({
  hide,
  show,
  address,
}: {
  hide: () => void;
  show: boolean;
  address: PublicKey;
}) {
  return (
    <AppModal title="Receive assets" hide={hide} show={show}>
      <View style={{ padding: 4 }}>
        <Text variant="p">
          You can receive assets by sending them to your public key:{"\n\n"}
          <Text variant="h4" style={{ fontFamily: 'monospace' }}>{address.toBase58()}</Text>
        </Text>
      </View>
    </AppModal>
  );
}

export function AccountTokens({ address }: { address: PublicKey }) {
  let query = useGetTokenAccounts({ address });
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 3;

  const items = useMemo(() => {
    const start = currentPage * itemsPerPage;
    const end = start + itemsPerPage;
    return query.data?.slice(start, end) ?? [];
  }, [query.data, currentPage, itemsPerPage]);

  const numberOfPages = useMemo(() => {
    return Math.ceil((query.data?.length ?? 0) / itemsPerPage);
  }, [query.data, itemsPerPage]);

  return (
    <>
      <Text variant="h4" style={{ color: colors.foregroundMuted }}>
        Token Accounts
      </Text>
      <ScrollView>
        {query.isLoading && <ActivityIndicator animating={true} color={colors.primary} />}
        {query.isError && (
          <View style={styles.errorContainer}>
            <Text variant="p" style={styles.errorText}>
              Error: {query.error?.message.toString()}
            </Text>
          </View>
        )}
        {query.isSuccess && (
          <>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text variant="small" style={styles.tableHeaderCell}>Public Key</Text>
                <Text variant="small" style={styles.tableHeaderCell}>Mint</Text>
                <Text variant="small" style={[styles.tableHeaderCell, styles.numeric]}>Balance</Text>
              </View>

              {query.data.length === 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text variant="p">No token accounts found.</Text>
                </View>
              )}

              {items?.map(({ account, pubkey }) => (
                <View key={pubkey.toString()} style={styles.tableRow}>
                  <Text variant="small" style={styles.tableCell}>
                    {ellipsify(pubkey.toString())}
                  </Text>
                  <Text variant="small" style={styles.tableCell}>
                    {ellipsify(account.data.parsed.info.mint)}
                  </Text>
                  <Text variant="small" style={[styles.tableCell, styles.numeric]}>
                    <AccountTokenBalance address={pubkey} />
                  </Text>
                </View>
              ))}

              {(query.data?.length ?? 0) > 3 && (
                <View style={styles.pagination}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setCurrentPage(Math.max(0, currentPage - 1))}
                    disabled={currentPage === 0}
                  >
                    Prev
                  </Button>
                  <Text variant="small">
                    {currentPage + 1} of {numberOfPages}
                  </Text>
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => setCurrentPage(Math.min(numberOfPages - 1, currentPage + 1))}
                    disabled={currentPage === numberOfPages - 1}
                  >
                    Next
                  </Button>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </>
  );
}

export function AccountTokenBalance({ address }: { address: PublicKey }) {
  const query = useGetTokenAccountBalance({ address });
  return query.isLoading ? (
    <ActivityIndicator animating={true} size="small" color={colors.primary} />
  ) : query.data ? (
    <Text variant="small">{query.data?.value.uiAmount}</Text>
  ) : (
    <Text variant="small">Error</Text>
  );
}

const styles = StyleSheet.create({
  accountBalance: {
    marginTop: 12,
  },
  accountButtonGroup: {
    paddingVertical: 4,
    flexDirection: "row",
  },
  errorContainer: {
    padding: 8,
    backgroundColor: colors.errorMuted,
    borderRadius: 8,
  },
  errorText: {
    color: colors.error,
  },
  table: {
    marginTop: spacing.sm,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    flex: 1,
    fontWeight: '600',
    color: colors.foregroundMuted,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    flex: 1,
  },
  numeric: {
    textAlign: 'right',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
  },
});
