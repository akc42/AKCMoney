<div class="actionblock">
<dl class="action">
	<dt>Form Action Block</dt>
	<dd jwcid="@For" source="ognl:actionItems" value="ognl:actionItem" index="ognl:index" element="dd">
		<div class="gg">
			<div class="ff">
				<div class="ee">
					<div class="dd">
						<div class="cc">
							<span jwcid="@If" condition="ognl:confirmAction">
								<a jwcid="@ConfirmSubmit" selected="ognl:selected" tag="ognl:(index+1)*(-1)" msg="ognl:msg">
									<span jwcid="@If" condition="ognl:index == 0">
										<span class="bbc">
											<span jwcid="@Any" class="aac" tabindex="ognl:index+1">
												<span jwcid="@Insert" value="ognl:actionItemText">Action</span>
											</span>
										</span>
									</span>
									<span jwcid="@Else" condition="ognl:index == 0">
										<span class="bb">
											<span jwcid="@Any" class="aa" tabindex="ognl:index+1">
												<span jwcid="@Insert" value="ognl:actionItemText">Action</span>
											</span>
										</span>
									</span>
								</a>
							</span>
							<span jwcid="@Else" condition="ognl:confirmAction">
								<a jwcid="@LinkSubmit" selected="ognl:selected" tag="ognl:(index+1)*(-1)">
									<span jwcid="@If" condition="ognl:index == 0">
										<span class="bbc">
											<span jwcid="@Any" class="aac" tabindex="ognl:index+1">
												<span jwcid="@Insert" value="ognl:actionItemText">Action</span>
											</span>
										</span>
									</span>
									<span jwcid="@Else" condition="ognl:index == 0">
										<span class="bb">
											<span jwcid="@Any" class="aa" tabindex="ognl:index+1">
												<span jwcid="@Insert" value="ognl:actionItemText">Action</span>
											</span>
										</span>
									</span>
								</a>
							</span>								
						</div>
					</div>
				</div>
			</div>
		</div>
	</dd>
</dl>
<div class="clear"></div>

</div>