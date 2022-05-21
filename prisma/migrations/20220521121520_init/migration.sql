-- CreateTable
CREATE TABLE "Transaction" (
    "id" SERIAL NOT NULL,
    "hash" TEXT NOT NULL,
    "nonce" INTEGER NOT NULL,
    "transaction_index" INTEGER NOT NULL,
    "from_address" TEXT NOT NULL,
    "to_address" TEXT,
    "value" BIGINT NOT NULL,
    "gas" INTEGER NOT NULL,
    "gas_price" BIGINT NOT NULL,
    "input" TEXT NOT NULL,
    "receipt_cumulative_gas_used" BIGINT NOT NULL,
    "receipt_gas_used" INTEGER NOT NULL,
    "receipt_contract_address" TEXT,
    "receipt_root" TEXT,
    "receipt_status" INTEGER NOT NULL,
    "block_timestamp" TEXT NOT NULL,
    "block_number" INTEGER NOT NULL,
    "block_hash" TEXT NOT NULL,
    "decoded_input" JSONB,
    "wallet_id" TEXT NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);
