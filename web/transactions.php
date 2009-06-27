<?php
/*
 	Copyright (c) 2009 Alan Chandler
    This file is part of AKCMoney.

    AKCMoney is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    AKCMoney is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with AKCMoney (file COPYING.txt).  If not, see <http://www.gnu.org/licenses/>.

*/
?>

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

