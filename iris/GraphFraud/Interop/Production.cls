/// One real IRIS Interoperability production: Business Service -> Business Process -> HTTP Business Operation.
/// AI Hub %AI.Agent is invoked by the business process for priority decisions.
Class GraphFraud.Interop.Production Extends Ens.Production
{
XData ProductionDefinition
{
<Production Name="GraphFraud.Interop.Production" LogGeneralTraceEvents="false">
  <Description>GraphFraud: transaction motif evidence plus governed AI Hub triage</Description>
  <ActorPoolSize>2</ActorPoolSize>
  <Item Name="GraphFraud.Inbound" ClassName="GraphFraud.Interop.IngestService" Enabled="true" PoolSize="0"></Item>
  <Item Name="GraphFraud.Router" ClassName="GraphFraud.Interop.Router" Enabled="true" PoolSize="1"></Item>
  <Item Name="GraphFraud.Score" ClassName="GraphFraud.Interop.ScoreOperation" Enabled="true" PoolSize="1">
    <Setting Target="Adapter" Name="HTTPServer">graphfraud-evidence</Setting>
    <Setting Target="Adapter" Name="HTTPPort">8787</Setting>
    <Setting Target="Adapter" Name="URL">/assess</Setting>
    <Setting Target="Adapter" Name="ExtraHeaders">Content-Type:application/json</Setting>
    <Setting Target="Adapter" Name="ResponseTimeout">20</Setting>
  </Item>
</Production>
}
}
