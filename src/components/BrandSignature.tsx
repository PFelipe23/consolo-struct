export default function BrandSignature({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={`brand-signature ${compact ? "compact" : ""}`}>
      <img
        src="/brand/consolostruct-128.png"
        width={compact ? 28 : 40}
        height={compact ? 28 : 40}
        alt=""
      />
      <div>
        <strong>ConsoloStruct</strong>
        <span>
          por{" "}
          <img
            src="/brand/openstruct-symbol.png"
            width="16"
            height="16"
            alt=""
          />
          <b>OPENSTRUCT</b>
        </span>
      </div>
    </div>
  );
}
