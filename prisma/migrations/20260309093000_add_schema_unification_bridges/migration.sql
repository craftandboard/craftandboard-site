ALTER TABLE "Order" ADD COLUMN "salesOrderId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "salesOrderItemId" TEXT;
ALTER TABLE "Part" ADD COLUMN "manufacturingPartId" TEXT;
ALTER TABLE "ManufacturingJob" ADD COLUMN "shelfJobId" TEXT;
ALTER TABLE "Batch" ADD COLUMN "manufacturingBatchId" TEXT;

CREATE UNIQUE INDEX "Order_salesOrderId_key" ON "Order"("salesOrderId");
CREATE UNIQUE INDEX "OrderItem_salesOrderItemId_key" ON "OrderItem"("salesOrderItemId");
CREATE UNIQUE INDEX "Part_manufacturingPartId_key" ON "Part"("manufacturingPartId");
CREATE UNIQUE INDEX "ManufacturingJob_shelfJobId_key" ON "ManufacturingJob"("shelfJobId");
CREATE UNIQUE INDEX "Batch_manufacturingBatchId_key" ON "Batch"("manufacturingBatchId");

ALTER TABLE "Order" ADD CONSTRAINT "Order_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Part" ADD CONSTRAINT "Part_manufacturingPartId_fkey" FOREIGN KEY ("manufacturingPartId") REFERENCES "ManufacturingPart"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ManufacturingJob" ADD CONSTRAINT "ManufacturingJob_shelfJobId_fkey" FOREIGN KEY ("shelfJobId") REFERENCES "ShelfJob"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_manufacturingBatchId_fkey" FOREIGN KEY ("manufacturingBatchId") REFERENCES "ManufacturingBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;
